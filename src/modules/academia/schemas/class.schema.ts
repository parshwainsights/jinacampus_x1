import { z } from "zod";
import {
  academicRecordStatusSchema,
  codeSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema,
  sortOrderSchema,
  trimmedString
} from "./shared";

export const createClassSchema = z.object({
  code: codeSchema,
  name: trimmedString(1, 120),
  description: optionalTrimmedString(300),
  sortOrder: sortOrderSchema.optional(),
  status: academicRecordStatusSchema.optional()
}).strict();

export const updateClassSchema = createClassSchema.partial().extend({
  classId: idSchema
}).strict().refine(({ classId: _classId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one class field is required"
});

export const listClassesSchema = z.object({
  search: searchSchema,
  status: academicRecordStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ListClassesInput = z.infer<typeof listClassesSchema>;
