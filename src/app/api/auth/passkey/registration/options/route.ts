import { NextResponse } from "next/server";

import { getTenantContext } from "@/lib/tenant/context";
import { getUserSafeErrorMessage } from "@/lib/errors";
import {
  createPasskeyRegistrationOptions
} from "@/modules/campus-core/passkey-auth.service";
import { passkeyRegistrationOptionsSchema } from "@/modules/campus-core/passkey-auth.schemas";

export async function POST(request: Request) {
  const parsed = passkeyRegistrationOptionsSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  }

  try {
    const ctx = await getTenantContext();
    const options = await createPasskeyRegistrationOptions(ctx, parsed.data.currentPassword);
    return NextResponse.json({ ok: true, options });
  } catch (error) {
    return NextResponse.json({
      error: getUserSafeErrorMessage(error, "Unable to add a passkey. Please try again.")
    }, { status: 400 });
  }
}
