-- Student registration admission-sheet fields.
-- Sensitive identity/bank inputs are stored as masked values and last-four digits only.
ALTER TABLE "students"
  ADD COLUMN "admissionDate" DATE,
  ADD COLUMN "fullName" TEXT,
  ADD COLUMN "fatherName" TEXT,
  ADD COLUMN "fatherOccupation" TEXT,
  ADD COLUMN "motherName" TEXT,
  ADD COLUMN "guardianName" TEXT,
  ADD COLUMN "aadhaarMasked" TEXT,
  ADD COLUMN "aadhaarLast4" TEXT,
  ADD COLUMN "familyIdNumber" TEXT,
  ADD COLUMN "sssmIdNumber" TEXT,
  ADD COLUMN "apaarIdNumber" TEXT,
  ADD COLUMN "religion" TEXT,
  ADD COLUMN "caste" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "nationality" TEXT,
  ADD COLUMN "currentAddress" TEXT,
  ADD COLUMN "permanentAddress" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "pincode" TEXT,
  ADD COLUMN "bankAccountMasked" TEXT,
  ADD COLUMN "bankAccountLast4" TEXT,
  ADD COLUMN "bankBranchName" TEXT,
  ADD COLUMN "ifscCode" TEXT;

UPDATE "students"
SET
  "fullName" = COALESCE(
    "displayName",
    NULLIF(TRIM(CONCAT_WS(' ', "firstName", "middleName", "lastName")), '')
  ),
  "admissionDate" = COALESCE("joinedAt", "createdAt"::date),
  "nationality" = COALESCE("nationality", 'India')
WHERE "fullName" IS NULL
   OR "admissionDate" IS NULL
   OR "nationality" IS NULL;

CREATE INDEX "students_tenantId_branchId_category_idx" ON "students"("tenantId", "branchId", "category");
