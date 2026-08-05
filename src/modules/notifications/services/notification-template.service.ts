import type { Prisma } from "@prisma/client";
import { WHATSAPP_TEMPLATE_KEYS } from "@/modules/notifications/templates/whatsapp-template-mapper";

const attendanceTemplates = [
  WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT,
  WHATSAPP_TEMPLATE_KEYS.STAFF_WEEKLY_ATTENDANCE_SUMMARY,
  WHATSAPP_TEMPLATE_KEYS.STAFF_MONTHLY_ATTENDANCE_SUMMARY
] as const;

export async function ensureAttendanceNotificationTemplates(
  tx: Prisma.TransactionClient,
  tenantId: string
) {
  for (const templateKey of attendanceTemplates) {
    const existing = await tx.notificationTemplate.findFirst({
      where: {
        tenantId,
        branchId: null,
        channel: "WHATSAPP",
        templateKey,
        languageCode: "en"
      },
      select: { id: true }
    });
    if (existing) {
      await tx.notificationTemplate.update({
        where: { id: existing.id },
        data: { category: "UTILITY", isActive: true }
      });
      continue;
    }
    await tx.notificationTemplate.create({
      data: {
        tenantId,
        branchId: null,
        channel: "WHATSAPP",
        templateKey,
        providerTemplateName: templateKey,
        languageCode: "en",
        category: "UTILITY",
        isActive: true
      }
    });
  }
}
