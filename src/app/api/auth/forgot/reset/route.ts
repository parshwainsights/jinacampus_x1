import { NextResponse } from "next/server";

import { forgotPasswordResetSchema } from "@/modules/campus-core/otp-auth.schemas";
import { OTP_VERIFY_ERROR_MESSAGE, resetPasswordWithOtp } from "@/modules/campus-core/otp-auth.service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = forgotPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Unable to reset password.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    await resetPasswordWithOtp(parsed.data, {
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined
    });
    return NextResponse.json({ ok: true, message: "Password reset successfully." });
  } catch {
    return NextResponse.json({ ok: false, error: OTP_VERIFY_ERROR_MESSAGE }, { status: 400 });
  }
}
