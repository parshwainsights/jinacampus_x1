import { z } from "zod";

const codePattern = /^[A-Z0-9_-]+$/;
const indianMobilePattern = /^(?:\+91)?[6-9]\d{9}$/;

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePhoneInput(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/[\s-]/g, "");
}

function cleanDateInput(value: unknown) {
  if (value === null || value === "") return undefined;
  return value;
}

export function hasAtLeastOneUpdateValue(value: Record<string, unknown>) {
  return Object.values(value).some((field) => field !== undefined);
}

export const idSchema = z.string().uuid();
export const optionalIdSchema = z.preprocess(emptyStringToUndefined, idSchema.optional());

export const codeSchema = z.string().trim().min(2).max(40).regex(codePattern);

export function trimmedString(minLength: number, maxLength: number) {
  return z.string().trim().min(minLength).max(maxLength);
}

export function optionalTrimmedString(maxLength: number) {
  return z.preprocess(emptyStringToUndefined, z.string().max(maxLength).optional());
}

export const dateSchema = z.preprocess(cleanDateInput, z.coerce.date());
export const optionalDateSchema = z.preprocess(cleanDateInput, z.coerce.date().optional());

export const emailSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().toLowerCase().email().max(180).optional()
);

export const phoneSchema = z.preprocess(
  normalizePhoneInput,
  z.string().regex(indianMobilePattern, "Enter a valid Indian mobile number").optional()
);

export const sortOrderSchema = z.coerce.number().int().min(0).max(10000);
export const capacitySchema = z.coerce.number().int().positive().max(500);

export const paginationFields = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
} as const;

export const searchSchema = optionalTrimmedString(120);

export const academicRecordStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const studentStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ALUMNI", "TRANSFERRED", "WITHDRAWN"]);
export const enrollmentStatusSchema = z.enum([
  "ACTIVE",
  "PROMOTED",
  "TRANSFERRED",
  "WITHDRAWN",
  "CANCELLED",
  "COMPLETED"
]);
export const guardianRelationSchema = z.enum([
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "GRANDFATHER",
  "GRANDMOTHER",
  "UNCLE",
  "AUNT",
  "SIBLING",
  "OTHER"
]);
export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]);
export const bloodGroupSchema = z.enum([
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
  "UNKNOWN"
]);
export const subjectTypeSchema = z.enum(["CORE", "ELECTIVE", "OPTIONAL", "CO_CURRICULAR"]);
