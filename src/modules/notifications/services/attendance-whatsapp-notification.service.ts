import type { StudentAttendanceNotificationMode, StudentAttendanceNotificationStatus } from "@/modules/notifications/templates/whatsapp-template-mapper";
import {
  buildStudentAttendanceTemplatePayload,
  shouldQueueStudentAttendanceStatus,
  WHATSAPP_TEMPLATE_KEYS
} from "@/modules/notifications/templates/whatsapp-template-mapper";
import { db } from "@/lib/db";
import { queueStudentAttendanceWhatsAppSchema } from "@/modules/notifications/schemas";
import {
  queueNotificationOutboxItem,
  type QueueNotificationOutboxItemInput
} from "@/modules/notifications/services/notification-outbox.service";
import { formatTimeInTimeZone, safeTimeZone } from "@/lib/dates/time-zone";

export type StudentAttendanceWhatsAppQueueResult = {
  checked: number;
  queued: number;
  alreadyQueued: number;
  skippedDisabled: number;
  skippedStatus: number;
  skippedNoGuardian: number;
  skippedNoConsent: number;
  skippedNoPhone: number;
  skippedTemplateMissing: number;
  failed: number;
};

type StudentAttendanceNotificationRecord = {
  id: string;
  tenantId: string;
  branchId: string;
  academicYearId: string;
  attendanceDate: Date;
  markedAt: Date | null;
  updatedAt: Date;
  status: StudentAttendanceNotificationStatus;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    displayName: string | null;
    guardianLinks: Array<{
      isPrimary: boolean;
      relation: string;
      guardian: {
        id: string;
        phone: string | null;
      };
    }>;
  };
  classSection: {
    displayName: string;
    branch: {
      timezone: string;
      institution: {
        name: string;
        displayName: string | null;
      };
    };
  };
};

type CommunicationPreferenceRecord = {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  attendanceAlertsEnabled: boolean;
  consentCapturedAt: Date | null;
};

type StudentNotificationDeps = {
  loadSettings(input: { tenantId: string; branchId: string }): Promise<{
    studentAttendanceWhatsAppEnabled: boolean;
    studentAttendanceNotificationMode: StudentAttendanceNotificationMode;
    sendStudentAbsentAlert: boolean;
    sendStudentLateAlert: boolean;
  } | null>;
  loadTemplate(input: { tenantId: string; branchId: string; templateKey: string }): Promise<{ id: string } | null>;
  loadAttendanceRecords(input: {
    tenantId: string;
    branchId: string;
    academicYearId: string;
    classSectionId: string;
    attendanceDate: Date;
    attendanceRecordIds?: string[];
  }): Promise<StudentAttendanceNotificationRecord[]>;
  loadCommunicationPreference(input: {
    tenantId: string;
    branchId: string;
    guardianId: string;
  }): Promise<CommunicationPreferenceRecord | null>;
  queueOutbox(input: QueueNotificationOutboxItemInput): Promise<{ status: "queued" | "alreadyQueued"; outboxId: string }>;
};

function blankResult(): StudentAttendanceWhatsAppQueueResult {
  return {
    checked: 0,
    queued: 0,
    alreadyQueued: 0,
    skippedDisabled: 0,
    skippedStatus: 0,
    skippedNoGuardian: 0,
    skippedNoConsent: 0,
    skippedNoPhone: 0,
    skippedTemplateMissing: 0,
    failed: 0
  };
}

function personName(input: { firstName: string; middleName: string | null; lastName: string | null; displayName: string | null }) {
  return input.displayName ?? [input.firstName, input.middleName, input.lastName].map((part) => part?.trim()).filter(Boolean).join(" ");
}

const guardianRelationPriority: Record<string, number> = {
  FATHER: 0,
  MOTHER: 1,
  GUARDIAN: 2
};

function orderedGuardianLinks(record: StudentAttendanceNotificationRecord) {
  return [...record.student.guardianLinks].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return (guardianRelationPriority[left.relation] ?? 10) - (guardianRelationPriority[right.relation] ?? 10);
  });
}

function isStatusEnabled(
  mode: StudentAttendanceNotificationMode,
  status: StudentAttendanceNotificationStatus,
  settings: { sendStudentAbsentAlert: boolean; sendStudentLateAlert: boolean }
) {
  if (!shouldQueueStudentAttendanceStatus(mode, status)) return false;
  if (mode !== "EXCEPTION_ONLY") return true;
  if (status === "ABSENT") return settings.sendStudentAbsentAlert;
  if (status === "LATE") return settings.sendStudentLateAlert;
  return true;
}

const defaultDeps: StudentNotificationDeps = {
  async loadSettings(input) {
    return db.attendanceSetting.findFirst({
      where: { tenantId: input.tenantId, branchId: input.branchId },
      select: {
        studentAttendanceWhatsAppEnabled: true,
        studentAttendanceNotificationMode: true,
        sendStudentAbsentAlert: true,
        sendStudentLateAlert: true
      }
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
  async loadAttendanceRecords(input) {
    return db.studentAttendanceRecord.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        academicYearId: input.academicYearId,
        classSectionId: input.classSectionId,
        attendanceDate: input.attendanceDate,
        sessionType: "FULL_DAY",
        ...(input.attendanceRecordIds?.length ? { id: { in: input.attendanceRecordIds } } : {})
      },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        academicYearId: true,
        attendanceDate: true,
        markedAt: true,
        updatedAt: true,
        status: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            displayName: true,
            guardianLinks: {
              select: {
                isPrimary: true,
                relation: true,
                guardian: {
                  select: {
                    id: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        classSection: {
          select: {
            displayName: true,
            branch: {
              select: {
                timezone: true,
                institution: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  },
  async loadCommunicationPreference(input) {
    return db.communicationPreference.findFirst({
      where: {
        tenantId: input.tenantId,
        ownerType: "GUARDIAN",
        ownerId: input.guardianId,
        OR: [{ branchId: input.branchId }, { branchId: null }]
      },
      select: {
        whatsappEnabled: true,
        whatsappNumber: true,
        attendanceAlertsEnabled: true,
        consentCapturedAt: true
      },
      orderBy: { updatedAt: "desc" }
    });
  },
  async queueOutbox(input) {
    return queueNotificationOutboxItem(input);
  }
};

export async function queueStudentAttendanceWhatsAppNotifications(
  input: unknown,
  deps: StudentNotificationDeps = defaultDeps
): Promise<StudentAttendanceWhatsAppQueueResult> {
  const data = queueStudentAttendanceWhatsAppSchema.parse(input);
  const result = blankResult();

  try {
    const settings = await deps.loadSettings({ tenantId: data.tenantId, branchId: data.branchId });
    if (!settings?.studentAttendanceWhatsAppEnabled || settings.studentAttendanceNotificationMode === "DISABLED") {
      result.skippedDisabled = data.attendanceRecordIds?.length ?? 1;
      return result;
    }

    const template = await deps.loadTemplate({
      tenantId: data.tenantId,
      branchId: data.branchId,
      templateKey: WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT
    });
    if (!template) {
      result.skippedTemplateMissing = data.attendanceRecordIds?.length ?? 1;
      return result;
    }

    const records = await deps.loadAttendanceRecords({
      tenantId: data.tenantId,
      branchId: data.branchId,
      academicYearId: data.academicYearId,
      classSectionId: data.classSectionId,
      attendanceDate: data.attendanceDate,
      attendanceRecordIds: data.attendanceRecordIds
    });
    result.checked = records.length;

    for (const record of records) {
      if (!isStatusEnabled(settings.studentAttendanceNotificationMode, record.status, settings)) {
        result.skippedStatus += 1;
        continue;
      }

      const guardianLinks = orderedGuardianLinks(record);
      if (guardianLinks.length === 0) {
        result.skippedNoGuardian += 1;
        continue;
      }

      let recipient: { guardianId: string; phone: string } | null = null;
      let consentedGuardianWithoutPhone = false;
      for (const link of guardianLinks) {
        const preference = await deps.loadCommunicationPreference({
          tenantId: record.tenantId,
          branchId: record.branchId,
          guardianId: link.guardian.id
        });
        if (!preference?.whatsappEnabled || !preference.attendanceAlertsEnabled || !preference.consentCapturedAt) {
          continue;
        }
        const phone = preference.whatsappNumber ?? link.guardian.phone;
        if (phone) {
          recipient = { guardianId: link.guardian.id, phone };
          break;
        }
        consentedGuardianWithoutPhone = true;
      }

      if (!recipient && consentedGuardianWithoutPhone) {
        result.skippedNoPhone += 1;
        continue;
      }
      if (!recipient) {
        result.skippedNoConsent += 1;
        continue;
      }

      const institution = record.classSection.branch.institution;
      const attendanceDate = record.attendanceDate.toISOString().slice(0, 10);
      const timeZone = safeTimeZone(record.classSection.branch.timezone);
      const queueResult = await deps.queueOutbox({
        tenantId: record.tenantId,
        branchId: record.branchId,
        academicYearId: record.academicYearId,
        channel: "WHATSAPP",
        templateKey: WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT,
        recipientType: "GUARDIAN",
        recipientId: recipient.guardianId,
        recipientPhone: recipient.phone,
        payload: buildStudentAttendanceTemplatePayload({
          studentName: personName(record.student),
          scholarNumber: record.student.admissionNumber,
          classSection: record.classSection.displayName,
          attendanceStatus: record.status,
          attendanceDate,
          attendanceMarkingTime: formatTimeInTimeZone(record.markedAt ?? record.updatedAt, timeZone),
          institutionName: institution.displayName ?? institution.name
        }),
        idempotencyKey: record.status === "ABSENT"
          ? `student-absence:${record.tenantId}:${record.student.id}:${attendanceDate}`
          : `student-daily-attendance:${record.tenantId}:${record.student.id}:${attendanceDate}:${record.status}`,
        scheduledFor: new Date(),
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
