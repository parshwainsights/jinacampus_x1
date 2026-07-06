-- AlterEnum
ALTER TYPE "PermissionModule" ADD VALUE IF NOT EXISTS 'NOTIFICATIONS';

-- CreateEnum
CREATE TYPE "CommunicationPreferenceOwnerType" AS ENUM ('GUARDIAN', 'STAFF');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationTemplateCategory" AS ENUM ('UTILITY');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('GUARDIAN', 'STAFF');

-- CreateEnum
CREATE TYPE "NotificationOutboxStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppProvider" AS ENUM ('META_CLOUD', 'BSP', 'DRY_RUN');

-- CreateEnum
CREATE TYPE "StudentAttendanceNotificationMode" AS ENUM ('DISABLED', 'EXCEPTION_ONLY', 'ALL_STATUSES');

-- AlterTable
ALTER TABLE "attendance_settings"
ADD COLUMN "studentAttendanceWhatsAppEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "studentAttendanceNotificationMode" "StudentAttendanceNotificationMode" NOT NULL DEFAULT 'EXCEPTION_ONLY',
ADD COLUMN "staffMonthlySummaryWhatsAppEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "staffMonthlySummarySendDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "staffMonthlySummarySendTime" TEXT NOT NULL DEFAULT '09:00';

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "ownerType" "CommunicationPreferenceOwnerType" NOT NULL,
    "ownerId" UUID NOT NULL,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNumber" TEXT,
    "attendanceAlertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "monthlySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "consentCapturedAt" TIMESTAMP(3),
    "consentSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "providerTemplateName" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "category" "NotificationTemplateCategory" NOT NULL DEFAULT 'UTILITY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "academicYearId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipientType" "NotificationRecipientType" NOT NULL,
    "recipientId" UUID NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "NotificationOutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "outboxId" UUID NOT NULL,
    "provider" "WhatsAppProvider" NOT NULL,
    "providerMessageId" TEXT,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "rawStatusJson" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_integration_settings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "provider" "WhatsAppProvider" NOT NULL DEFAULT 'META_CLOUD',
    "phoneNumberId" TEXT,
    "businessAccountId" TEXT,
    "accessTokenEncrypted" TEXT,
    "webhookVerifyTokenHash" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_preferences_tenantId_branchId_idx" ON "communication_preferences"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX "communication_preferences_tenantId_ownerType_idx" ON "communication_preferences"("tenantId", "ownerType");

-- CreateIndex
CREATE UNIQUE INDEX "communication_preferences_tenantId_ownerType_ownerId_key" ON "communication_preferences"("tenantId", "ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "notification_templates_tenantId_branchId_channel_templateKey_idx" ON "notification_templates"("tenantId", "branchId", "channel", "templateKey");

-- CreateIndex
CREATE INDEX "notification_templates_tenantId_channel_isActive_idx" ON "notification_templates"("tenantId", "channel", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "notification_outbox_idempotencyKey_key" ON "notification_outbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_outbox_tenantId_status_scheduledFor_idx" ON "notification_outbox"("tenantId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "notification_outbox_tenantId_recipientType_recipientId_idx" ON "notification_outbox"("tenantId", "recipientType", "recipientId");

-- CreateIndex
CREATE INDEX "notification_outbox_tenantId_branchId_createdAt_idx" ON "notification_outbox"("tenantId", "branchId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_tenantId_outboxId_createdAt_idx" ON "notification_delivery_logs"("tenantId", "outboxId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_providerMessageId_idx" ON "notification_delivery_logs"("providerMessageId");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_tenantId_status_createdAt_idx" ON "notification_delivery_logs"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_integration_settings_tenantId_branchId_isEnabled_idx" ON "whatsapp_integration_settings"("tenantId", "branchId", "isEnabled");

-- CreateIndex
CREATE INDEX "whatsapp_integration_settings_tenantId_provider_idx" ON "whatsapp_integration_settings"("tenantId", "provider");

-- AddForeignKey
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_outboxId_fkey" FOREIGN KEY ("outboxId") REFERENCES "notification_outbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_integration_settings" ADD CONSTRAINT "whatsapp_integration_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_integration_settings" ADD CONSTRAINT "whatsapp_integration_settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
