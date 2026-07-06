import { z } from "zod";
import {
  emailSchema,
  guardianRelationSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalTrimmedString,
  paginationFields,
  phoneSchema,
  searchSchema,
  trimmedString
} from "./shared";

export const createGuardianSchema = z.object({
  firstName: trimmedString(1, 80),
  middleName: optionalTrimmedString(80),
  lastName: optionalTrimmedString(80),
  displayName: optionalTrimmedString(180),
  phone: phoneSchema,
  email: emailSchema,
  occupation: optionalTrimmedString(120),
  addressLine1: optionalTrimmedString(180),
  addressLine2: optionalTrimmedString(180),
  city: optionalTrimmedString(80),
  state: optionalTrimmedString(80),
  postalCode: optionalTrimmedString(20),
  country: optionalTrimmedString(80)
}).strict();

export const updateGuardianSchema = createGuardianSchema.partial().extend({
  guardianId: idSchema
}).strict().refine(({ guardianId: _guardianId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one guardian field is required"
});

export const linkGuardianSchema = z.object({
  studentId: idSchema,
  guardianId: idSchema,
  relation: guardianRelationSchema,
  isPrimary: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  hasPickupPermission: z.boolean().optional()
}).strict();

export const updateStudentGuardianLinkSchema = z.object({
  studentGuardianLinkId: idSchema,
  relation: guardianRelationSchema.optional(),
  isPrimary: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  hasPickupPermission: z.boolean().optional()
}).strict().refine(({ studentGuardianLinkId: _studentGuardianLinkId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one guardian link field is required"
});

export const listGuardiansSchema = z.object({
  search: searchSchema,
  phone: phoneSchema,
  email: emailSchema,
  ...paginationFields
}).strict();

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>;
export type UpdateStudentGuardianLinkInput = z.infer<typeof updateStudentGuardianLinkSchema>;
export type ListGuardiansInput = z.infer<typeof listGuardiansSchema>;
