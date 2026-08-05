-- File bytes live in a private object-storage bucket. This table stores only
-- tenant-scoped metadata and object paths; it never stores public file URLs.
CREATE TYPE "StudentDocumentType" AS ENUM (
  'PASSPORT_PHOTO',
  'TRANSFER_CERTIFICATE',
  'BIRTH_CERTIFICATE',
  'IDENTITY_PROOF',
  'PREVIOUS_SCHOOL_REPORT',
  'CASTE_CERTIFICATE',
  'MIGRATION_CERTIFICATE',
  'MEDICAL_CERTIFICATE',
  'OTHER'
);

CREATE TABLE "student_documents" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "branchId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "type" "StudentDocumentType" NOT NULL,
  "title" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "storageBucket" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT NOT NULL,
  "uploadedById" UUID,
  "deletedById" UUID,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_documents_storageBucket_storagePath_key"
  ON "student_documents"("storageBucket", "storagePath");
CREATE INDEX "student_documents_tenantId_studentId_deletedAt_idx"
  ON "student_documents"("tenantId", "studentId", "deletedAt");
CREATE INDEX "student_documents_tenantId_branchId_type_idx"
  ON "student_documents"("tenantId", "branchId", "type");

ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
