import { queueStaffWeeklyAttendanceWhatsAppSummaries } from "@/modules/notifications/services/staff-weekly-whatsapp-summary.service";

export async function queueStaffWeeklySummaryJob(input: unknown) {
  return queueStaffWeeklyAttendanceWhatsAppSummaries(input);
}
