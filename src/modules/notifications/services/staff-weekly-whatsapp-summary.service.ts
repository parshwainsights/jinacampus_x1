import { db } from "@/lib/db";
import { formatDateInTimeZone, safeTimeZone } from "@/lib/dates/time-zone";
import { queueStaffWeeklyWhatsAppSummarySchema } from "@/modules/notifications/schemas";
import {
  calculateStaffMonthlySummary,
  type StaffAttendanceSummaryMember,
  type StaffAttendanceSummaryRecord,
  type StaffMonthlyWhatsAppQueueResult
} from "@/modules/notifications/services/staff-monthly-whatsapp-summary.service";
import {
  queueNotificationOutboxItem,
  type QueueNotificationOutboxItemInput
} from "@/modules/notifications/services/notification-outbox.service";
import {
  buildStaffWeeklySummaryTemplatePayload,
  WHATSAPP_TEMPLATE_KEYS
} from "@/modules/notifications/templates/whatsapp-template-mapper";

type StaffWeeklyPreference = {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  weeklySummaryEnabled: boolean;
  consentCapturedAt: Date | null;
};

type StaffWeeklyDeps = {
  loadSettings(input: { tenantId: string; branchId: string }): Promise<{
    staffWeeklySummaryWhatsAppEnabled: boolean;
  } | null>;
  loadTemplate(input: { tenantId: string; branchId: string; templateKey: string }): Promise<{ id: string } | null>;
  loadActiveStaff(input: { tenantId: string; branchId: string }): Promise<StaffAttendanceSummaryMember[]>;
  loadAttendanceRecords(input: {
    tenantId: string;
    branchId: string;
    staffIds: string[];
    startDate: Date;
    endDate: Date;
  }): Promise<StaffAttendanceSummaryRecord[]>;
  loadCommunicationPreference(input: {
    tenantId: string;
    branchId: string;
    staffId: string;
  }): Promise<StaffWeeklyPreference | null>;
  queueOutbox(input: QueueNotificationOutboxItemInput): Promise<{ status: "queued" | "alreadyQueued"; outboxId: string }>;
  getInstitutionContext(input: { tenantId: string; branchId: string }): Promise<{ name: string; timeZone: string }>;
};

function blankResult(): StaffMonthlyWhatsAppQueueResult {
  return {
    checked: 0,
    queued: 0,
    skippedDisabled: 0,
    skippedNoConsent: 0,
    skippedNoPhone: 0,
    alreadyQueued: 0,
    skippedTemplateMissing: 0,
    failed: 0
  };
}

const defaultDeps: StaffWeeklyDeps = {
  async loadSettings(input) {
    return db.attendanceSetting.findFirst({
      where: { tenantId: input.tenantId, branchId: input.branchId },
      select: { staffWeeklySummaryWhatsAppEnabled: true }
    });
  },
  async loadTemplate(input) {
    const branchTemplate = await db.notificationTemplate.findFirst({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        channel: "WHATSAPP",
        templateKey: input.templateKey,
        isActive: true
      },
      select: { id: true }
    });
    if (branchTemplate) return branchTemplate;
    return db.notificationTemplate.findFirst({
      where: {
        tenantId: input.tenantId,
        branchId: null,
        channel: "WHATSAPP",
        templateKey: input.templateKey,
        isActive: true
      },
      select: { id: true }
    });
  },
  async loadActiveStaff(input) {
    return db.staffProfile.findMany({
      where: { tenantId: input.tenantId, branchId: input.branchId, employmentStatus: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
    });
  },
  async loadAttendanceRecords(input) {
    return db.staffAttendanceRecord.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        staffId: { in: input.staffIds },
        attendanceDate: { gte: input.startDate, lte: input.endDate }
      },
      select: { staffId: true, status: true, workingMinutes: true }
    });
  },
  async loadCommunicationPreference(input) {
    return db.communicationPreference.findFirst({
      where: {
        tenantId: input.tenantId,
        ownerType: "STAFF",
        ownerId: input.staffId,
        OR: [{ branchId: input.branchId }, { branchId: null }]
      },
      select: {
        whatsappEnabled: true,
        whatsappNumber: true,
        weeklySummaryEnabled: true,
        consentCapturedAt: true
      },
      orderBy: { updatedAt: "desc" }
    });
  },
  async queueOutbox(input) {
    return queueNotificationOutboxItem(input);
  },
  async getInstitutionContext(input) {
    const branch = await db.branch.findFirst({
      where: { id: input.branchId, tenantId: input.tenantId },
      select: { timezone: true, institution: { select: { name: true, displayName: true } } }
    });
    return {
      name: branch?.institution.displayName ?? branch?.institution.name ?? "JinaCampus",
      timeZone: safeTimeZone(branch?.timezone)
    };
  }
};

export async function queueStaffWeeklyAttendanceWhatsAppSummaries(
  input: unknown,
  deps: StaffWeeklyDeps = defaultDeps
): Promise<StaffMonthlyWhatsAppQueueResult> {
  const data = queueStaffWeeklyWhatsAppSummarySchema.parse(input);
  const result = blankResult();

  try {
    const settings = await deps.loadSettings({ tenantId: data.tenantId, branchId: data.branchId });
    if (!settings?.staffWeeklySummaryWhatsAppEnabled) {
      result.skippedDisabled = 1;
      return result;
    }

    const template = await deps.loadTemplate({
      tenantId: data.tenantId,
      branchId: data.branchId,
      templateKey: WHATSAPP_TEMPLATE_KEYS.STAFF_WEEKLY_ATTENDANCE_SUMMARY
    });
    if (!template) {
      result.skippedTemplateMissing = 1;
      return result;
    }

    const staff = await deps.loadActiveStaff({ tenantId: data.tenantId, branchId: data.branchId });
    const records = await deps.loadAttendanceRecords({
      tenantId: data.tenantId,
      branchId: data.branchId,
      staffIds: staff.map((member) => member.id),
      startDate: data.startDate,
      endDate: data.endDate
    });
    const institution = await deps.getInstitutionContext({ tenantId: data.tenantId, branchId: data.branchId });
    const recordsByStaffId = new Map<string, StaffAttendanceSummaryRecord[]>();
    for (const record of records) {
      const memberRecords = recordsByStaffId.get(record.staffId) ?? [];
      memberRecords.push(record);
      recordsByStaffId.set(record.staffId, memberRecords);
    }
    const startKey = data.startDate.toISOString().slice(0, 10);
    const endKey = data.endDate.toISOString().slice(0, 10);
    const weekLabel = `${formatDateInTimeZone(data.startDate, institution.timeZone)} to ${formatDateInTimeZone(data.endDate, institution.timeZone)}`;

    result.checked = staff.length;
    for (const member of staff) {
      const preference = await deps.loadCommunicationPreference({
        tenantId: data.tenantId,
        branchId: data.branchId,
        staffId: member.id
      });
      if (!preference?.whatsappEnabled || !preference.weeklySummaryEnabled || !preference.consentCapturedAt) {
        result.skippedNoConsent += 1;
        continue;
      }
      const recipientPhone = preference.whatsappNumber ?? member.phone;
      if (!recipientPhone) {
        result.skippedNoPhone += 1;
        continue;
      }

      const summary = calculateStaffMonthlySummary(member, recordsByStaffId.get(member.id) ?? []);
      const queueResult = await deps.queueOutbox({
        tenantId: data.tenantId,
        branchId: data.branchId,
        academicYearId: null,
        channel: "WHATSAPP",
        templateKey: WHATSAPP_TEMPLATE_KEYS.STAFF_WEEKLY_ATTENDANCE_SUMMARY,
        recipientType: "STAFF",
        recipientId: member.id,
        recipientPhone,
        payload: buildStaffWeeklySummaryTemplatePayload({
          staffName: summary.staffName,
          week: weekLabel,
          workingDays: summary.workingDays,
          markedDays: summary.markedDays,
          presentDays: summary.presentDays,
          lateDays: summary.lateDays,
          halfDayDays: summary.halfDayDays,
          leaveDays: summary.leaveDays,
          absentDays: summary.absentDays,
          notMarkedDays: summary.notMarkedDays,
          weekOffDays: summary.weekOffDays,
          holidayDays: summary.holidayDays,
          totalWorkingMinutes: summary.totalWorkingMinutes,
          institutionName: institution.name
        }),
        idempotencyKey: `staff-weekly-summary:${data.tenantId}:${member.id}:${startKey}:${endKey}`,
        actorUserId: data.actorUserId ?? null
      });
      if (queueResult.status === "queued") result.queued += 1;
      if (queueResult.status === "alreadyQueued") result.alreadyQueued += 1;
    }

    return result;
  } catch {
    return { ...result, failed: result.failed + 1 };
  }
}
