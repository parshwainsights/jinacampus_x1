import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashSessionToken } from "@/lib/auth/session";
import { getTenantContext } from "@/lib/tenant/context";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";

export async function POST(request: NextRequest) {
  const rawToken = request.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  const ctx = await getTenantContext().catch(() => null);

  if (rawToken) {
    const tokenHash = await hashSessionToken(rawToken);
    await db.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  if (ctx) {
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.ADMINISTRATOR_LOGOUT,
      entityType: "User",
      entityId: ctx.userId,
      metadata: { userEmail: ctx.userEmail }
    }).catch(() => null);
  }

  const response = NextResponse.redirect(new URL("/administrator/login", request.url), { status: 303 });
  response.cookies.delete(env.SESSION_COOKIE_NAME);
  return response;
}
