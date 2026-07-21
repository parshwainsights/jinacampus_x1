import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    PASSWORD_PEPPER: "test-only-password-pepper",
    NODE_ENV: "test"
  }
}));

import {
  generateNumericOtp,
  hashOtp,
  maskPhone,
  normalizePhone,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  verifyOtp
} from "@/lib/auth/otp";
import {
  adminOtpRequestSchema,
  forgotPasswordResetSchema,
  strongPasswordSchema
} from "@/modules/campus-core/otp-auth.schemas";

describe("OTP auth utilities", () => {
  it("generates six digits and stores/verifies only a hash", () => {
    const otp = generateNumericOtp();
    const hash = hashOtp(otp);

    expect(otp).toMatch(/^\d{6}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(otp);
    expect(verifyOtp(otp, hash)).toBe(true);
    expect(verifyOtp("000000", hash)).toBe(otp === "000000");
  });

  it("normalizes Indian and E.164 phone numbers and masks output", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("+91-98765-43210")).toBe("+919876543210");
    expect(normalizePhone("invalid")).toBeNull();
    expect(maskPhone("+919876543210")).toMatch(/3210$/);
    expect(maskPhone("+919876543210")).not.toContain("98765");
  });

  it("enforces password strength and strict client input boundaries", () => {
    expect(strongPasswordSchema.safeParse("StrongPass@123").success).toBe(true);
    expect(strongPasswordSchema.safeParse("weakpassword").success).toBe(false);
    expect(adminOtpRequestSchema.safeParse({
      tenantSlug: "jinacampus-demo",
      phone: "+919876543210",
      purpose: "ADMIN_LOGIN",
      tenantId: "client-tenant-id"
    }).success).toBe(false);
    expect(forgotPasswordResetSchema.safeParse({
      tenantSlug: "jinacampus-demo",
      email: "admin@example.com",
      otp: "123456",
      newPassword: "StrongPass@123"
    }).success).toBe(true);
  });

  it("keeps attempt and resend limits explicit", () => {
    expect(OTP_MAX_ATTEMPTS).toBe(5);
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});
