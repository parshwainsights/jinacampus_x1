import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  createPasskeyAuthenticationOptions
} from "@/modules/campus-core/passkey-auth.service";
import { passkeyAuthenticationOptionsSchema } from "@/modules/campus-core/passkey-auth.schemas";
import { validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

const PASSKEY_ERROR = "Passkey sign-in is unavailable. Use your employee code and password.";

export async function POST(request: Request) {
  const parsed = passkeyAuthenticationOptionsSchema.safeParse(
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
    select: { id: true, status: true }
  });
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: PASSKEY_ERROR }, { status: 401 });
  }

  try {
    const options = await createPasskeyAuthenticationOptions({
      tenantId: tenant.id,
      identifier: parsed.data.identifier,
      metadata: {
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined
      }
    });
    return NextResponse.json({ ok: true, options });
  } catch (error) {
    const status = error instanceof AppError && error.status === 429 ? 429 : 400;
    return NextResponse.json({ error: PASSKEY_ERROR }, { status });
  }
}
