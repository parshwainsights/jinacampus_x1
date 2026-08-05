ALTER TABLE "attendance_settings"
ADD COLUMN "staffWeeklySummaryWhatsAppEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "staffWeeklySummarySendDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "staffWeeklySummarySendTime" TEXT NOT NULL DEFAULT '09:00';

ALTER TABLE "communication_preferences"
ADD COLUMN "weeklySummaryEnabled" BOOLEAN NOT NULL DEFAULT false;
