import { z } from "zod";
import {
  dateSchema,
  enrollmentStatusSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalDateSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema
} from "./shared";

function leftDateIsNotBeforeEnrollmentDate(value: { enrolledOn?: Date; leftOn?: Date }) {
  if (!value.enrolledOn || !value.leftOn) return true;
  return value.leftOn >= value.enrolledOn;
}

export const createEnrollmentSchema = z.object({
  branchId: idSchema,
  academicYearId: idSchema,
  studentId: idSchema,
  classSectionId: idSchema,
  rollNumber: optionalTrimmedString(40),
  status: enrollmentStatusSchema.optional(),
  enrolledOn: dateSchema,
  leftOn: optionalDateSchema
}).strict().refine(leftDateIsNotBeforeEnrollmentDate, {
  message: "Left date must not be before enrolled date",
  path: ["leftOn"]
});

export const updateEnrollmentSchema = z.object({
  enrollmentId: idSchema,
  branchId: idSchema.optional(),
  academicYearId: idSchema.optional(),
  classSectionId: idSchema.optional(),
  rollNumber: optionalTrimmedString(40),
  status: enrollmentStatusSchema.optional(),
  enrolledOn: optionalDateSchema,
  leftOn: optionalDateSchema
}).strict().refine(({ enrollmentId: _enrollmentId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one enrollment field is required"
}).refine(leftDateIsNotBeforeEnrollmentDate, {
  message: "Left date must not be before enrolled date",
  path: ["leftOn"]
});

export const listEnrollmentsSchema = z.object({
  branchId: idSchema.optional(),
  academicYearId: idSchema.optional(),
  studentId: idSchema.optional(),
  classSectionId: idSchema.optional(),
  search: searchSchema,
  status: enrollmentStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type ListEnrollmentsInput = z.infer<typeof listEnrollmentsSchema>;
