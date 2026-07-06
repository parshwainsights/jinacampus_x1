import { z } from "zod";
import { scanStaffQrSchema } from "@/modules/staffboard-lite/schemas";
import {
  attendanceDateSchema,
  submitStudentAttendanceSchema
} from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

const mobileSchoolIdSchema = z.string().trim().transform((value, ctx) => {
  const result = validateSchoolId(value);
  if (!result.ok) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
    return z.NEVER;
  }
  return result.schoolId;
});

export const mobileLoginSchema = z.object({
  schoolId: mobileSchoolIdSchema.optional(),
  tenantSlug: mobileSchoolIdSchema.optional(),
  email: z.string().trim().email().max(180).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200)
}).strict().superRefine((data, ctx) => {
  if (!data.schoolId && !data.tenantSlug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["schoolId"],
      message: "School ID is required."
    });
    return;
  }

  if (data.schoolId && data.tenantSlug && data.schoolId !== data.tenantSlug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantSlug"],
      message: "Legacy tenantSlug must match School ID."
    });
  }
}).transform((data) => ({
  schoolId: data.schoolId ?? data.tenantSlug ?? "",
  email: data.email,
  password: data.password
}));

export const mobileQrScanSchema = scanStaffQrSchema;

export const mobileAttendanceDateQuerySchema = z.object({
  date: attendanceDateSchema.optional()
}).strict();

export const mobileClassSectionParamsSchema = z.object({
  classSectionId: idSchema
}).strict();

export const mobileStudentAttendanceSubmitSchema = submitStudentAttendanceSchema;

export type MobileLoginInput = z.infer<typeof mobileLoginSchema>;
export type MobileQrScanInput = z.infer<typeof mobileQrScanSchema>;
export type MobileAttendanceDateQueryInput = z.infer<typeof mobileAttendanceDateQuerySchema>;
export type MobileClassSectionParamsInput = z.infer<typeof mobileClassSectionParamsSchema>;
export type MobileStudentAttendanceSubmitInput = z.infer<typeof mobileStudentAttendanceSubmitSchema>;
