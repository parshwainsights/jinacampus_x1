-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHER', 'ADMIN', 'ACCOUNTANT', 'LIBRARIAN', 'DRIVER', 'HELPER', 'SECURITY', 'PEON', 'CLEANING_STAFF', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'WEEK_OFF', 'HOLIDAY', 'NOT_MARKED');

-- CreateEnum
CREATE TYPE "StaffAttendanceSource" AS ENUM ('QR_SCAN', 'MANUAL_ADMIN', 'IMPORT', 'BIOMETRIC');

-- CreateEnum
CREATE TYPE "StaffQrPurpose" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "userId" UUID,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "staffType" "StaffType" NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "joiningDate" DATE,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "academicYearId" UUID,
    "staffId" UUID NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "StaffAttendanceStatus" NOT NULL DEFAULT 'NOT_MARKED',
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "workingMinutes" INTEGER,
    "checkInSource" "StaffAttendanceSource",
    "checkOutSource" "StaffAttendanceSource",
    "checkInQrTokenId" UUID,
    "checkOutQrTokenId" UUID,
    "markedById" UUID,
    "updatedById" UUID,
    "correctionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance_qr_tokens" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "StaffQrPurpose" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "consumedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_attendance_qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE INDEX "staff_profiles_tenantId_branchId_idx" ON "staff_profiles"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX "staff_profiles_tenantId_staffType_idx" ON "staff_profiles"("tenantId", "staffType");

-- CreateIndex
CREATE INDEX "staff_profiles_tenantId_employmentStatus_idx" ON "staff_profiles"("tenantId", "employmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_tenantId_employeeCode_key" ON "staff_profiles"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "staff_attendance_records_tenantId_branchId_attendanceDate_idx" ON "staff_attendance_records"("tenantId", "branchId", "attendanceDate");

-- CreateIndex
CREATE INDEX "staff_attendance_records_tenantId_branchId_academicYearId_idx" ON "staff_attendance_records"("tenantId", "branchId", "academicYearId");

-- CreateIndex
CREATE INDEX "staff_attendance_records_tenantId_staffId_idx" ON "staff_attendance_records"("tenantId", "staffId");

-- CreateIndex
CREATE INDEX "staff_attendance_records_tenantId_status_attendanceDate_idx" ON "staff_attendance_records"("tenantId", "status", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_records_tenantId_branchId_staffId_attendan_key" ON "staff_attendance_records"("tenantId", "branchId", "staffId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_qr_tokens_tokenHash_key" ON "staff_attendance_qr_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "staff_attendance_qr_tokens_tenantId_branchId_validFrom_vali_idx" ON "staff_attendance_qr_tokens"("tenantId", "branchId", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "staff_attendance_qr_tokens_tenantId_branchId_purpose_idx" ON "staff_attendance_qr_tokens"("tenantId", "branchId", "purpose");

-- CreateIndex
CREATE INDEX "staff_attendance_qr_tokens_validUntil_idx" ON "staff_attendance_qr_tokens"("validUntil");

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_checkInQrTokenId_fkey" FOREIGN KEY ("checkInQrTokenId") REFERENCES "staff_attendance_qr_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_checkOutQrTokenId_fkey" FOREIGN KEY ("checkOutQrTokenId") REFERENCES "staff_attendance_qr_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_qr_tokens" ADD CONSTRAINT "staff_attendance_qr_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_qr_tokens" ADD CONSTRAINT "staff_attendance_qr_tokens_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_qr_tokens" ADD CONSTRAINT "staff_attendance_qr_tokens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
