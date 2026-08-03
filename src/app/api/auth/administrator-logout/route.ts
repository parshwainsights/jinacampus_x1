import { NextResponse, type NextRequest } from "next/server";

import { writePlatformAuditLog } from "@/lib/audit/platform-audit-log";
import {
  getPlatformAdministratorContext,
  hashPlatformAdministratorSessionToken
} from "@/lib/auth/platform-administrator-session";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PLATFORM_ADMINISTRATOR_AUDIT_EVENTS } from "@/modules/campus-core/platform-administrator-audit-events";

export async function POST(request: NextRequest) {
  const rawToken = request.cookies.get(env.PLATFORM_SESSION_COOKIE_NAME)?.value;
  const ctx = await getPlatformAdministratorContext({ allowPasswordChangeRequired: true }).catch(() => null);

  if (rawToken) {
    const tokenHash = await hashPlatformAdministratorSessionToken(rawToken);
    await db.$transaction(async (tx) => {
      await tx.platformAdministratorSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      if (ctx) {
        await writePlatformAuditLog({
          ctx,
          action: PLATFORM_ADMINISTRATOR_AUDIT_EVENTS.LOGOUT,
          entityType: "PlatformAdministrator",
          entityId: ctx.administratorId
        }, tx);
      }
    });
  }

  const response = NextResponse.redirect(new URL("/administrator/login", request.url), { status: 303 });
  response.cookies.delete(env.PLATFORM_SESSION_COOKIE_NAME);
  return response;
}
