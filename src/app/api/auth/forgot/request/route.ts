import { NextResponse } from "next/server";

import { forgotPasswordRequestSchema } from "@/modules/campus-core/otp-auth.schemas";
import {
  PASSWORD_RESET_REQUEST_PUBLIC_MESSAGE,
  requestForgotPasswordOtp
} from "@/modules/campus-core/otp-auth.service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = forgotPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Unable to process this request." }, { status: 400 });
  }

  await requestForgotPasswordOtp(parsed.data, {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined
  }).catch(() => null);

  return NextResponse.json({ ok: true, message: PASSWORD_RESET_REQUEST_PUBLIC_MESSAGE });
}
