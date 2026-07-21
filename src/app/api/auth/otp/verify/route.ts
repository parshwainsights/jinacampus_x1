import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookies";
import { adminOtpVerifySchema } from "@/modules/campus-core/otp-auth.schemas";
import { OTP_VERIFY_ERROR_MESSAGE, verifyAdminLoginOtp } from "@/modules/campus-core/otp-auth.service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = adminOtpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: OTP_VERIFY_ERROR_MESSAGE }, { status: 400 });
  }

  try {
    const result = await verifyAdminLoginOtp(parsed.data, {
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined
    });
    await setSessionCookie(result.rawToken, result.expiresAt);
    return NextResponse.json({ ok: true, redirectTo: result.redirectTo });
  } catch {
    return NextResponse.json({ ok: false, error: OTP_VERIFY_ERROR_MESSAGE }, { status: 401 });
  }
}
