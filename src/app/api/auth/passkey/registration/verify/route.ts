import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { getTenantContext } from "@/lib/tenant/context";
import {
  verifyPasskeyRegistration
} from "@/modules/campus-core/passkey-auth.service";
import { passkeyRegistrationVerifySchema } from "@/modules/campus-core/passkey-auth.schemas";

export async function POST(request: Request) {
  const parsed = passkeyRegistrationVerifySchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Unable to add a passkey. Please try again." }, { status: 400 });
  }

  try {
    const credential = await verifyPasskeyRegistration({
      ctx: await getTenantContext(),
      challenge: parsed.data.challenge,
      response: parsed.data.response as unknown as RegistrationResponseJSON,
      name: parsed.data.name
    });
    return NextResponse.json({ ok: true, credential });
  } catch {
    return NextResponse.json({ error: "Unable to add a passkey. Please try again." }, { status: 400 });
  }
}
