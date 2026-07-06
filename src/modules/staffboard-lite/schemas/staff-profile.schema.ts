import { z } from "zod";
import {
  emailSchema,
  employmentStatusSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalDateSchema,
  optionalTrimmedString,
  paginationFields,
  phoneSchema,
  searchSchema,
  staffTypeSchema,
  trimmedString
} from "./shared";

const password = z.string().min(8, "Password must be at least 8 characters.").max(200);
const requiredLoginEmail = z.string().trim().toLowerCase().email("Enter a valid email address.").max(180);

export const staffLoginRoleCodeSchema = z.enum(["STAFF", "TEACHER", "CLASS_TEACHER", "OFFICE_STAFF"]);

const staffProfileBaseSchema = z.object({
  branchId: idSchema,
  employeeCode: trimmedString(1, 60),
  firstName: trimmedString(1, 80),
  middleName: optionalTrimmedString(80),
  lastName: optionalTrimmedString(80),
  staffType: staffTypeSchema,
  designation: optionalTrimmedString(120),
  department: optionalTrimmedString(120),
  phone: phoneSchema,
  email: emailSchema,
  joiningDate: optionalDateSchema,
  employmentStatus: employmentStatusSchema.optional()
}).strict();

export const createStaffProfileSchema = staffProfileBaseSchema.extend({
  createLoginAccess: z.boolean().default(false),
  loginRoleCode: staffLoginRoleCodeSchema.default("STAFF"),
  initialPassword: password.optional(),
  confirmInitialPassword: z.string().max(200).optional()
}).strict().superRefine((value, ctx) => {
  if (!value.createLoginAccess) return;

  if (!value.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email is required when creating login access.",
      path: ["email"]
    });
  }
  if (!value.initialPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 8 characters.",
      path: ["initialPassword"]
    });
  }
  if (value.initialPassword !== value.confirmInitialPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password and confirmation do not match.",
      path: ["confirmInitialPassword"]
    });
  }
});

export const createStaffLoginAccessSchema = z.object({
  staffId: idSchema,
  email: requiredLoginEmail,
  phone: phoneSchema,
  loginRoleCode: staffLoginRoleCodeSchema.default("STAFF"),
  initialPassword: password,
  confirmInitialPassword: z.string().max(200)
}).strict().refine((value) => value.initialPassword === value.confirmInitialPassword, {
  message: "New password and confirmation do not match.",
  path: ["confirmInitialPassword"]
});

export const disableStaffLoginAccessSchema = z.object({
  staffId: idSchema,
  confirmDisableLoginAccess: z.boolean().refine((value) => value, {
    message: "Confirm that login access should be disabled."
  })
}).strict();

export const updateStaffProfileSchema = staffProfileBaseSchema.partial().extend({
  staffId: idSchema
}).strict().refine(({ staffId: _staffId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one staff profile field is required"
});

export const listStaffProfilesSchema = z.object({
  branchId: idSchema.optional(),
  search: searchSchema,
  staffType: staffTypeSchema.optional(),
  employmentStatus: employmentStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateStaffProfileInput = z.infer<typeof createStaffProfileSchema>;
export type CreateStaffLoginAccessInput = z.infer<typeof createStaffLoginAccessSchema>;
export type DisableStaffLoginAccessInput = z.infer<typeof disableStaffLoginAccessSchema>;
export type UpdateStaffProfileInput = z.infer<typeof updateStaffProfileSchema>;
export type ListStaffProfilesInput = z.infer<typeof listStaffProfilesSchema>;
