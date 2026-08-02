import { NextResponse } from "next/server";

import { getTenantContext } from "@/lib/tenant/context";
import { getUserSafeErrorMessage } from "@/lib/errors";
import { listPasskeys, removePasskey } from "@/modules/campus-core/passkey-auth.service";
import { passkeyDeleteSchema } from "@/modules/campus-core/passkey-auth.schemas";

export async function GET() {
  try {
    const credentials = await listPasskeys(await getTenantContext());
    return NextResponse.json({ ok: true, credentials });
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  const parsed = passkeyDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the passkey details and try again." }, { status: 400 });
  }
  try {
    await removePasskey(await getTenantContext(), parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      error: getUserSafeErrorMessage(error, "Unable to remove this passkey.")
    }, { status: 400 });
  }
}
