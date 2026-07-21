import { z } from "zod";

const schoolId = z.string().trim().min(3).max(50);
const phone = z.string().trim().min(8).max(24);
const otp = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP.");

export const strongPasswordSchema = z.string()
  .min(10, "Password must be at least 10 characters.")
  .max(200)
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/\d/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const adminOtpRequestSchema = z.object({
  tenantSlug: schoolId,
  phone,
  purpose: z.literal("ADMIN_LOGIN")
}).strict();

export const adminOtpVerifySchema = z.object({
  tenantSlug: schoolId,
  phone,
  otp,
  purpose: z.literal("ADMIN_LOGIN")
}).strict();

const forgotPasswordIdentityFields = {
  tenantSlug: schoolId,
  email: z.string().trim().email().max(180).optional(),
  phone: phone.optional()
} as const;

function hasOneIdentifier(value: { email?: string; phone?: string }) {
  return Boolean(value.email) !== Boolean(value.phone);
}

export const forgotPasswordRequestSchema = z.object(forgotPasswordIdentityFields).strict().refine(hasOneIdentifier, {
  message: "Provide either email or contact number.",
  path: ["email"]
});

export const forgotPasswordResetSchema = z.object({
  ...forgotPasswordIdentityFields,
  otp,
  newPassword: strongPasswordSchema
}).strict().refine(hasOneIdentifier, {
  message: "Provide either email or contact number.",
  path: ["email"]
});

export type AdminOtpRequestInput = z.infer<typeof adminOtpRequestSchema>;
export type AdminOtpVerifyInput = z.infer<typeof adminOtpVerifySchema>;
export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResetInput = z.infer<typeof forgotPasswordResetSchema>;
