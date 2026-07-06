import { z } from "zod";
import {
  academicRecordStatusSchema,
  capacitySchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalIdSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema,
  trimmedString
} from "./shared";

export const createClassSectionSchema = z.object({
  branchId: idSchema,
  academicYearId: idSchema,
  classId: idSchema,
  sectionId: idSchema,
  classTeacherUserId: optionalIdSchema,
  displayName: trimmedString(1, 160),
  capacity: capacitySchema.optional(),
  status: academicRecordStatusSchema.optional()
}).strict();

export const updateClassSectionSchema = z.object({
  classSectionId: idSchema,
  classId: idSchema.optional(),
  sectionId: idSchema.optional(),
  classTeacherUserId: optionalIdSchema,
  displayName: optionalTrimmedString(160),
  capacity: capacitySchema.optional(),
  status: academicRecordStatusSchema.optional()
}).strict().refine(({ classSectionId: _classSectionId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one class-section field is required"
});

export const listClassSectionsSchema = z.object({
  branchId: idSchema.optional(),
  academicYearId: idSchema.optional(),
  classId: idSchema.optional(),
  sectionId: idSchema.optional(),
  classTeacherUserId: idSchema.optional(),
  search: searchSchema,
  status: academicRecordStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateClassSectionInput = z.infer<typeof createClassSectionSchema>;
export type UpdateClassSectionInput = z.infer<typeof updateClassSectionSchema>;
export type ListClassSectionsInput = z.infer<typeof listClassSectionsSchema>;
