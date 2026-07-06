import { z } from "zod";
import {
  academicRecordStatusSchema,
  hasAtLeastOneUpdateValue,
  idSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema,
  sortOrderSchema,
  trimmedString
} from "./shared";

const sectionCodeSchema = trimmedString(1, 40).regex(/^[A-Z0-9_-]+$/);

export const createSectionSchema = z.object({
  code: sectionCodeSchema,
  name: trimmedString(1, 120),
  description: optionalTrimmedString(300),
  sortOrder: sortOrderSchema.optional(),
  status: academicRecordStatusSchema.optional()
}).strict();

export const updateSectionSchema = createSectionSchema.partial().extend({
  sectionId: idSchema
}).strict().refine(({ sectionId: _sectionId, ...value }) => hasAtLeastOneUpdateValue(value), {
  message: "At least one section field is required"
});

export const listSectionsSchema = z.object({
  search: searchSchema,
  status: academicRecordStatusSchema.optional(),
  ...paginationFields
}).strict();

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ListSectionsInput = z.infer<typeof listSectionsSchema>;
