import { z } from "zod";
import { idSchema, trimmedString } from "./shared";

export const STUDENT_DOCUMENT_TYPES = [
  "PASSPORT_PHOTO",
  "TRANSFER_CERTIFICATE",
  "BIRTH_CERTIFICATE",
  "IDENTITY_PROOF",
  "PREVIOUS_SCHOOL_REPORT",
  "CASTE_CERTIFICATE",
  "MIGRATION_CERTIFICATE",
  "MEDICAL_CERTIFICATE",
  "OTHER"
] as const;

export const studentDocumentTypeSchema = z.enum(STUDENT_DOCUMENT_TYPES);

export const studentDocumentMetadataSchema = z.object({
  studentId: idSchema,
  type: studentDocumentTypeSchema,
  title: trimmedString(1, 120)
}).strict();

export const studentDocumentParamsSchema = z.object({
  studentId: idSchema,
  documentId: idSchema
}).strict();

export type StudentDocumentTypeValue = z.infer<typeof studentDocumentTypeSchema>;

export const STUDENT_DOCUMENT_LABELS: Record<StudentDocumentTypeValue, string> = {
  PASSPORT_PHOTO: "Passport-size photograph",
  TRANSFER_CERTIFICATE: "School Transfer Certificate",
  BIRTH_CERTIFICATE: "Birth Certificate",
  IDENTITY_PROOF: "Identity proof",
  PREVIOUS_SCHOOL_REPORT: "Previous school report card",
  CASTE_CERTIFICATE: "Caste Certificate",
  MIGRATION_CERTIFICATE: "Migration Certificate",
  MEDICAL_CERTIFICATE: "Medical Certificate",
  OTHER: "Other admission document"
};
