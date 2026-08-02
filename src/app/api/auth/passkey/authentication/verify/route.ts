import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import {
  verifyPasskeyAuthentication
} from "@/modules/campus-core/passkey-auth.service";
import { passkeyAuthenticationVerifySchema } from "@/modules/campus-core/passkey-auth.schemas";
import { validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

const PASSKEY_ERROR = "Passkey sign-in failed. Use your employee code and password.";

export async function POST(request: Request) {
  const parsed = passkeyAuthenticationVerifySchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: PASSKEY_ERROR }, { status: 400 });
  }

  const schoolId = validateSchoolId(parsed.data.schoolId ?? parsed.data.tenantSlug);
  if (!schoolId.ok) {
    return NextResponse.json({ error: PASSKEY_ERROR }, { status: 400 });
  }
  const tenant = await db.tenant.findUnique({
    where: { slug: schoolId.schoolId },
    select: { id: true, name: true, status: true }
  });
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: PASSKEY_ERROR }, { status: 401 });
  }

  try {
    const session = await verifyPasskeyAuthentication({
      tenant,
      challenge: parsed.data.challenge,
      response: parsed.data.response as unknown as AuthenticationResponseJSON,
      metadata: {
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined
      }
    });
    await setSessionCookie(session.rawToken, session.expiresAt);
    return NextResponse.json({ ok: true, redirectTo: session.redirectTo });
  } catch {
    return NextResponse.json({ error: PASSKEY_ERROR }, { status: 401 });
  }
}
