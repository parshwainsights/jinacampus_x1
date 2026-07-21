import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export type OtpDeliveryPurpose = "ADMIN_LOGIN" | "FORGOT_PASSWORD";

export function generateNumericOtp(length = OTP_LENGTH) {
  if (!Number.isInteger(length) || length < 4 || length > 8) {
    throw new Error("OTP_LENGTH_INVALID");
  }

  const maximum = 10 ** length;
  return randomInt(0, maximum).toString().padStart(length, "0");
}

export function hashOtp(otp: string) {
  return createHmac("sha256", env.PASSWORD_PEPPER).update(`jinacampus:otp:${otp}`).digest("hex");
}

export function verifyOtp(otp: string, storedHash: string) {
  if (!/^\d{6}$/.test(otp) || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;

  const candidate = Buffer.from(hashOtp(otp), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function maskPhone(phone: string) {
  const normalized = normalizePhone(phone) ?? phone;
  const visible = normalized.slice(-4);
  const prefix = normalized.startsWith("+") ? normalized.slice(0, Math.min(3, normalized.length - 4)) : "";
  return `${prefix}${"*".repeat(Math.max(normalized.length - prefix.length - visible.length, 4))}${visible}`;
}

export function getOtpExpiresAt(now = new Date()) {
  return new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);
}

export async function deliverOtp(input: { phone: string; otp: string; purpose: OtpDeliveryPurpose }) {
  if (env.NODE_ENV !== "production") {
    console.info(`[JinaCampus OTP:${input.purpose}] ${maskPhone(input.phone)} code ${input.otp}`);
    return { mode: "DEVELOPMENT_LOG" as const };
  }

  // Production SMS provider integration is intentionally deferred to an approved adapter.
  return { mode: "SMS_PROVIDER_PENDING" as const };
}
