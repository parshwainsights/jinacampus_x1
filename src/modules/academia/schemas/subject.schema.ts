import { z } from "zod";
import {
  academicRecordStatusSchema,
  codeSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema,
  subjectTypeSchema,
  trimmedString
} from "./shared";

export const createSubjectSchema = z.object({
  code: codeSchema,
  name: trimmedString(1, 120),
  type: subjectTypeSchema.optional(),
  description: optionalTrimmedString(300),
  status: academicRecordStatusSchema.optional()
}).strict();

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  subjectId: idSchema
}).strict().refine(({ subjectId: _subjectId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one subject field is required"
});

export const listSubjectsSchema = z.object({
  search: searchSchema,
  type: subjectTypeSchema.optional(),
  status: academicRecordStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
