import { z } from "zod";

const uuid = z.string().uuid();
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

export const queueStudentAttendanceWhatsAppSchema = z.object({
  tenantId: uuid,
  branchId: uuid,
  academicYearId: uuid,
  classSectionId: uuid,
  attendanceDate: z.coerce.date(),
  attendanceRecordIds: z.array(uuid).optional(),
  actorUserId: uuid.optional()
}).strict();

export const queueStaffWeeklyWhatsAppSummarySchema = z.object({
  tenantId: uuid,
  branchId: uuid,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  actorUserId: uuid.optional()
}).strict().refine((value) => value.startDate <= value.endDate, {
  message: "Weekly report start date must be on or before the end date.",
  path: ["endDate"]
});

export const queueStaffMonthlyWhatsAppSummarySchema = z.object({
  tenantId: uuid,
  branchId: uuid,
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  actorUserId: uuid.optional()
}).strict();

export const processNotificationOutboxSchema = z.object({
  tenantId: uuid,
  branchId: uuid.optional(),
  limit: z.number().int().min(1).max(100).default(25)
}).strict();

export const updateNotificationAttendanceSettingsSchema = z.object({
  branchId: uuid,
  studentAttendanceWhatsAppEnabled: z.boolean().default(false),
  studentAttendanceNotificationMode: z.enum(["DISABLED", "EXCEPTION_ONLY", "ALL_STATUSES"]).default("EXCEPTION_ONLY"),
  staffWeeklySummaryWhatsAppEnabled: z.boolean().default(false),
  staffWeeklySummarySendDay: z.number().int().min(1).max(7).default(1),
  staffWeeklySummarySendTime: z.string().regex(hhmm).default("09:00"),
  staffMonthlySummaryWhatsAppEnabled: z.boolean().default(false),
  staffMonthlySummarySendDay: z.number().int().min(1).max(28).default(1),
  staffMonthlySummarySendTime: z.string().regex(hhmm).default("09:00")
}).strict();

export const notificationOutboxClientFilterSchema = z.object({
  status: z.enum(["QUEUED", "SENDING", "SENT", "FAILED", "CANCELLED"]).optional(),
  channel: z.enum(["WHATSAPP"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50)
}).strict();
