import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/cookies";
import { activeRoleCodes, findLoginUser } from "@/lib/auth/login-identity";
import { createLoginSession } from "@/lib/auth/login-session";
import { hasSchoolLoginRole } from "@/lib/rbac/roles";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import { SCHOOL_LOGIN_ERROR_MESSAGE, validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

const loginSchema = z.object({
  schoolId: z.unknown().optional(),
  tenantSlug: z.unknown().optional(),
  identifier: z.string().trim().min(1).max(180).optional(),
  email: z.string().trim().email().max(180).optional(),
  password: z.string().min(1).max(200)
}).strict().refine((value) => Boolean(value.identifier || value.email), {
  message: "Enter an employee code or email.",
  path: ["identifier"]
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 400 });

  const identifier = parsed.data.identifier ?? parsed.data.email ?? "";
  const { password } = parsed.data;
  const schoolIdResult = validateSchoolId(parsed.data.schoolId ?? parsed.data.tenantSlug);
  if (!schoolIdResult.ok) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 400 });
  const schoolId = schoolIdResult.schoolId;

  const tenant = await db.tenant.findUnique({ where: { slug: schoolId } });
  if (!tenant || tenant.status !== "ACTIVE") return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });

  const resolved = await findLoginUser(db, tenant.id, identifier);
  if (!resolved?.user.passwordCredential) {
    return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });
  }
  const roleCodes = activeRoleCodes(resolved.user);
  if (!hasSchoolLoginRole(roleCodes)) {
    return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });
  }

  const valid = await verifyPassword(password, resolved.user.passwordCredential.passwordHash);
  if (!valid) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });

  const session = await db.$transaction((tx) => createLoginSession(tx, {
    tenant,
    user: resolved.user,
    roleCodes,
    passwordChangeRequired: resolved.user.passwordCredential?.mustChange ?? false,
    authMethod: "PASSWORD",
    identifierType: resolved.identifierType,
    auditAction: CAMPUS_CORE_AUDIT_EVENTS.AUTH_LOGIN_PASSWORD_SUCCESS,
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined
  }));
  await setSessionCookie(session.rawToken, session.expiresAt);

  return NextResponse.json({
    ok: true,
    redirectTo: session.redirectTo,
    passwordChangeRequired: resolved.user.passwordCredential.mustChange
  });
}
