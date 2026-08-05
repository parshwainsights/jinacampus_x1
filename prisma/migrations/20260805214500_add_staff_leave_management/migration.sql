-- CreateEnum
CREATE TYPE "StaffLeaveApplicationStatus" AS ENUM ('PENDING', 'CLARIFICATION_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "StaffLeaveDuration" AS ENUM ('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF');

-- CreateEnum
CREATE TYPE "StaffLeaveActionType" AS ENUM ('SUBMITTED', 'MODIFIED', 'CLARIFICATION_REQUESTED', 'CLARIFICATION_PROVIDED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "StaffLeaveApprovalMode" AS ENUM ('PRINCIPAL_ONLY', 'DESIGNATED_APPROVERS', 'PRINCIPAL_OR_DESIGNATED');

-- AlterTable
ALTER TABLE "communication_preferences" ADD COLUMN "leaveUpdatesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "staff_attendance_records" ADD COLUMN "leaveApplicationId" UUID;

-- CreateTable
CREATE TABLE "staff_leave_settings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,
    "allowBackdatedApplications" BOOLEAN NOT NULL DEFAULT false,
    "minimumNoticeDays" INTEGER NOT NULL DEFAULT 0,
    "maximumConsecutiveDays" INTEGER NOT NULL DEFAULT 30,
    "nonWorkingWeekdays" INTEGER[] NOT NULL DEFAULT ARRAY[0]::INTEGER[],
    "approvalMode" "StaffLeaveApprovalMode" NOT NULL DEFAULT 'PRINCIPAL_OR_DESIGNATED',
    "whatsappNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_types" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "balanceTracked" BOOLEAN NOT NULL DEFAULT true,
    "annualLimit" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "carryForwardLimit" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,
    "supportingDocumentRequired" BOOLEAN NOT NULL DEFAULT false,
    "documentRequiredAfterDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_approvers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_balances" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "allocatedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "adjustedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "usedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "duration" "StaffLeaveDuration" NOT NULL DEFAULT 'FULL_DAY',
    "totalDays" DECIMAL(8,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "StaffLeaveApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "staffClarification" TEXT,
    "approverRemarks" TEXT,
    "actionedById" UUID,
    "actionedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_application_actions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "StaffLeaveActionType" NOT NULL,
    "previousStatus" "StaffLeaveApplicationStatus",
    "nextStatus" "StaffLeaveApplicationStatus",
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_leave_application_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leave_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leave_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- Supabase defense in depth. JinaCampus accesses these tables only through the
-- server-side Prisma role; browser clients receive no direct table policies.
ALTER TABLE "staff_leave_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_approvers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_application_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_leave_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "in_app_notifications" ENABLE ROW LEVEL SECURITY;

-- CreateIndex
CREATE UNIQUE INDEX "staff_leave_settings_branchId_key" ON "staff_leave_settings"("branchId");
CREATE INDEX "staff_leave_settings_tenantId_branchId_idx" ON "staff_leave_settings"("tenantId", "branchId");
CREATE UNIQUE INDEX "staff_leave_types_tenantId_branchId_code_key" ON "staff_leave_types"("tenantId", "branchId", "code");
CREATE INDEX "staff_leave_types_tenantId_branchId_isActive_idx" ON "staff_leave_types"("tenantId", "branchId", "isActive");
CREATE UNIQUE INDEX "staff_leave_approvers_tenantId_branchId_userId_key" ON "staff_leave_approvers"("tenantId", "branchId", "userId");
CREATE INDEX "staff_leave_approvers_tenantId_branchId_isActive_idx" ON "staff_leave_approvers"("tenantId", "branchId", "isActive");
CREATE UNIQUE INDEX "staff_leave_balances_tenantId_branchId_staffId_leaveTypeId_year_key" ON "staff_leave_balances"("tenantId", "branchId", "staffId", "leaveTypeId", "year");
CREATE INDEX "staff_leave_balances_tenantId_branchId_year_idx" ON "staff_leave_balances"("tenantId", "branchId", "year");
CREATE INDEX "staff_leave_balances_tenantId_staffId_year_idx" ON "staff_leave_balances"("tenantId", "staffId", "year");
CREATE INDEX "staff_leave_applications_tenantId_branchId_status_submittedAt_idx" ON "staff_leave_applications"("tenantId", "branchId", "status", "submittedAt");
CREATE INDEX "staff_leave_applications_tenantId_staffId_startDate_endDate_idx" ON "staff_leave_applications"("tenantId", "staffId", "startDate", "endDate");
CREATE INDEX "staff_leave_applications_tenantId_leaveTypeId_startDate_idx" ON "staff_leave_applications"("tenantId", "leaveTypeId", "startDate");
CREATE INDEX "staff_leave_application_actions_tenantId_branchId_applicationId_createdAt_idx" ON "staff_leave_application_actions"("tenantId", "branchId", "applicationId", "createdAt");
CREATE INDEX "staff_leave_application_actions_tenantId_actorUserId_createdAt_idx" ON "staff_leave_application_actions"("tenantId", "actorUserId", "createdAt");
CREATE INDEX "staff_leave_documents_tenantId_branchId_applicationId_deletedAt_idx" ON "staff_leave_documents"("tenantId", "branchId", "applicationId", "deletedAt");
CREATE INDEX "in_app_notifications_tenantId_userId_readAt_createdAt_idx" ON "in_app_notifications"("tenantId", "userId", "readAt", "createdAt");
CREATE INDEX "in_app_notifications_tenantId_branchId_createdAt_idx" ON "in_app_notifications"("tenantId", "branchId", "createdAt");
CREATE INDEX "staff_attendance_records_tenantId_leaveApplicationId_idx" ON "staff_attendance_records"("tenantId", "leaveApplicationId");

-- AddForeignKey
ALTER TABLE "staff_leave_settings" ADD CONSTRAINT "staff_leave_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_settings" ADD CONSTRAINT "staff_leave_settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_types" ADD CONSTRAINT "staff_leave_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_types" ADD CONSTRAINT "staff_leave_types_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_approvers" ADD CONSTRAINT "staff_leave_approvers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_approvers" ADD CONSTRAINT "staff_leave_approvers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_approvers" ADD CONSTRAINT "staff_leave_approvers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "staff_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_leave_applications" ADD CONSTRAINT "staff_leave_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_applications" ADD CONSTRAINT "staff_leave_applications_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_applications" ADD CONSTRAINT "staff_leave_applications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_leave_applications" ADD CONSTRAINT "staff_leave_applications_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "staff_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_leave_applications" ADD CONSTRAINT "staff_leave_applications_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_leave_application_actions" ADD CONSTRAINT "staff_leave_application_actions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_application_actions" ADD CONSTRAINT "staff_leave_application_actions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_application_actions" ADD CONSTRAINT "staff_leave_application_actions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "staff_leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_application_actions" ADD CONSTRAINT "staff_leave_application_actions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_leave_documents" ADD CONSTRAINT "staff_leave_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_documents" ADD CONSTRAINT "staff_leave_documents_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave_documents" ADD CONSTRAINT "staff_leave_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "staff_leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_attendance_records" ADD CONSTRAINT "staff_attendance_records_leaveApplicationId_fkey" FOREIGN KEY ("leaveApplicationId") REFERENCES "staff_leave_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add leave permissions used by StaffBoard services and navigation.
INSERT INTO "permissions" ("id", "code", "module", "description", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'staffboard.leave.self_apply', 'STAFFBOARD', 'Submit and maintain the authenticated staff member''s leave applications.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staffboard.leave.self_view', 'STAFFBOARD', 'View the authenticated staff member''s leave applications and balances.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staffboard.leave.view', 'STAFFBOARD', 'View branch-scoped staff leave applications.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staffboard.leave.approve', 'STAFFBOARD', 'Review branch-scoped staff leave applications when designated.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staffboard.leave.settings.manage', 'STAFFBOARD', 'Manage branch leave policy, leave types, and approvers.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staffboard.leave.balance.manage', 'STAFFBOARD', 'Adjust branch-scoped staff leave balances.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Principals and legacy principal aliases receive branch-scoped leave governance.
INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), role."tenantId", role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" AS role
JOIN "permissions" AS permission ON permission."code" IN (
  'staffboard.leave.view',
  'staffboard.leave.approve',
  'staffboard.leave.settings.manage',
  'staffboard.leave.balance.manage'
)
WHERE role."code" IN ('PRINCIPAL', 'TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN')
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;

-- School staff receive only their own leave workspace by default.
INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), role."tenantId", role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" AS role
JOIN "permissions" AS permission ON permission."code" IN ('staffboard.leave.self_apply', 'staffboard.leave.self_view')
WHERE role."code" IN ('OFFICE_STAFF', 'TEACHER', 'CLASS_TEACHER', 'STAFF')
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;

-- Office staff can be explicitly designated as branch approvers. The service
-- still requires an active staff_leave_approvers row before review actions.
INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), role."tenantId", role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" AS role
JOIN "permissions" AS permission ON permission."code" IN ('staffboard.leave.view', 'staffboard.leave.approve')
WHERE role."code" = 'OFFICE_STAFF'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
