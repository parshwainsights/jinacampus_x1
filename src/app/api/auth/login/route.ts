import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createRawSessionToken, getSessionExpiresAt, hashSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import { getPostLoginRedirectPath } from "@/modules/campus-core/auth-redirect";
import { SCHOOL_LOGIN_ERROR_MESSAGE, validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

const loginSchema = z.object({
  schoolId: z.unknown().optional(),
  tenantSlug: z.unknown().optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 400 });

  const { email, password } = parsed.data;
  const schoolIdResult = validateSchoolId(parsed.data.schoolId ?? parsed.data.tenantSlug);
  if (!schoolIdResult.ok) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 400 });
  const schoolId = schoolIdResult.schoolId;

  const tenant = await db.tenant.findUnique({ where: { slug: schoolId } });
  if (!tenant || tenant.status !== "ACTIVE") return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });

  const now = new Date();
  const user = await db.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    include: {
      passwordCredential: true,
      roleAssignments: {
        where: {
          tenantId: tenant.id,
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
          ]
        },
        select: { role: { select: { code: true, isActive: true } } }
      }
    }
  });

  if (!user || user.status !== "ACTIVE" || !user.passwordCredential) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });

  const valid = await verifyPassword(password, user.passwordCredential.passwordHash);
  if (!valid) return NextResponse.json({ error: SCHOOL_LOGIN_ERROR_MESSAGE }, { status: 401 });

  const rawToken = createRawSessionToken();
  const tokenHash = await hashSessionToken(rawToken);
  const expiresAt = getSessionExpiresAt();

  await db.session.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined
    }
  });

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAuditLog({
    ctx: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      userId: user.id,
      userEmail: user.email,
      userType: user.userType,
      activeBranchId: null,
      accessibleBranchIds: [],
      activeAcademicYearId: null,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined
    },
    action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_LOGIN_SUCCESS,
    entityType: "User",
    entityId: user.id,
    metadata: { userEmail: user.email }
  });
  await setSessionCookie(rawToken, expiresAt);

  const roleCodes = Array.from(new Set(
    user.roleAssignments
      .filter((assignment) => assignment.role.isActive)
      .map((assignment) => assignment.role.code)
  ));

  return NextResponse.json({ ok: true, redirectTo: getPostLoginRedirectPath(roleCodes) });
}
