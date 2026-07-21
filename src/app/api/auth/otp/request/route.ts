import { NextResponse } from "next/server";

import { adminOtpRequestSchema } from "@/modules/campus-core/otp-auth.schemas";
import { OTP_REQUEST_PUBLIC_MESSAGE, requestAdminLoginOtp } from "@/modules/campus-core/otp-auth.service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = adminOtpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Unable to process this request." }, { status: 400 });
  }

  await requestAdminLoginOtp(parsed.data, {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined
  }).catch(() => null);

  return NextResponse.json({ ok: true, message: OTP_REQUEST_PUBLIC_MESSAGE });
}
