import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createRawSessionToken, getSessionExpiresAt, hashSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { PLATFORM_ADMIN_ROLE_CODES } from "@/lib/rbac/roles";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import { ADMINISTRATOR_LOGIN_ERROR_MESSAGE } from "@/modules/campus-core/tenant-login-policy";

const administratorLoginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = administratorLoginSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: ADMINISTRATOR_LOGIN_ERROR_MESSAGE }, { status: 400 });

  const now = new Date();
  const users = await db.user.findMany({
    where: {
      email: parsed.data.email,
      status: "ACTIVE",
      tenant: { status: "ACTIVE" },
      roleAssignments: {
        some: {
          isActive: true,
          role: { code: { in: [...PLATFORM_ADMIN_ROLE_CODES] }, isActive: true },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
          ]
        }
      }
    },
    include: {
      tenant: true,
      passwordCredential: true,
      roleAssignments: {
        where: {
          isActive: true,
          role: { code: { in: [...PLATFORM_ADMIN_ROLE_CODES] }, isActive: true },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
          ]
        },
        select: { role: { select: { code: true, isActive: true } } }
      }
    },
    orderBy: { createdAt: "asc" },
    take: 10
  });

  for (const user of users) {
    if (!user.passwordCredential) continue;
    const valid = await verifyPassword(parsed.data.password, user.passwordCredential.passwordHash);
    if (!valid) continue;

    const rawToken = createRawSessionToken();
    const tokenHash = await hashSessionToken(rawToken);
    const expiresAt = getSessionExpiresAt();

    await db.session.create({
      data: {
        tenantId: user.tenantId,
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
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        userId: user.id,
        userEmail: user.email,
        userType: user.userType,
        activeBranchId: null,
        accessibleBranchIds: [],
        activeAcademicYearId: null,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined
      },
      action: CAMPUS_CORE_AUDIT_EVENTS.ADMINISTRATOR_LOGIN_SUCCESS,
      entityType: "User",
      entityId: user.id,
      metadata: { userEmail: user.email, roleCodes: user.roleAssignments.map((assignment) => assignment.role.code) }
    });
    await setSessionCookie(rawToken, expiresAt);

    return NextResponse.json({ ok: true, redirectTo: "/administrator" });
  }

  return NextResponse.json({ error: ADMINISTRATOR_LOGIN_ERROR_MESSAGE }, { status: 401 });
}
