import { queueStaffMonthlyAttendanceWhatsAppSummaries } from "@/modules/notifications/services/staff-monthly-whatsapp-summary.service";

export async function queueStaffMonthlySummaryJob(input: unknown) {
  return queueStaffMonthlyAttendanceWhatsAppSummaries(input);
}
