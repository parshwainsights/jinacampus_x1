-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'ELECTIVE', 'OPTIONAL', 'CO_CURRICULAR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EnrollmentStatus" ADD VALUE 'PROMOTED';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "students" ALTER COLUMN "gender" TYPE "Gender" USING (
  CASE
    WHEN "gender" IS NULL OR btrim("gender") = '' THEN 'NOT_SPECIFIED'
    WHEN upper("gender") IN ('MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED') THEN upper("gender")
    ELSE 'NOT_SPECIFIED'
  END::"Gender"
);
ALTER TABLE "students" ALTER COLUMN "gender" SET DEFAULT 'NOT_SPECIFIED';
ALTER TABLE "students" ALTER COLUMN "gender" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "bloodGroup" TYPE "BloodGroup" USING (
  CASE
    WHEN "bloodGroup" IS NULL OR btrim("bloodGroup") = '' THEN NULL
    WHEN upper(replace(replace(replace("bloodGroup", ' ', '_'), '+', '_POSITIVE'), '-', '_NEGATIVE')) IN (
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'UNKNOWN'
    ) THEN upper(replace(replace(replace("bloodGroup", ' ', '_'), '+', '_POSITIVE'), '-', '_NEGATIVE'))
    ELSE 'UNKNOWN'
  END::"BloodGroup"
);

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "type" "SubjectType" NOT NULL DEFAULT 'CORE';
