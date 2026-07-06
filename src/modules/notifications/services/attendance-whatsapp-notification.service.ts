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
  status: StudentAttendanceNotificationStatus;
  student: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    displayName: string | null;
    guardianLinks: Array<{
      guardian: {
        id: string;
        phone: string | null;
      };
    }>;
  };
  classSection: {
    displayName: string;
    branch: {
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
};

type StudentNotificationDeps = {
  loadSettings(input: { tenantId: string; branchId: string }): Promise<{
    studentAttendanceWhatsAppEnabled: boolean;
    studentAttendanceNotificationMode: StudentAttendanceNotificationMode;
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

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function personName(input: { firstName: string; middleName: string | null; lastName: string | null; displayName: string | null }) {
  return input.displayName ?? [input.firstName, input.middleName, input.lastName].map((part) => part?.trim()).filter(Boolean).join(" ");
}

const defaultDeps: StudentNotificationDeps = {
  async loadSettings(input) {
    return db.attendanceSetting.findFirst({
      where: { tenantId: input.tenantId, branchId: input.branchId },
      select: {
        studentAttendanceWhatsAppEnabled: true,
        studentAttendanceNotificationMode: true
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
        status: true,
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            displayName: true,
            guardianLinks: {
              where: { isPrimary: true },
              select: {
                guardian: {
                  select: {
                    id: true,
                    phone: true
                  }
                }
              },
              take: 1
            }
          }
        },
        classSection: {
          select: {
            displayName: true,
            branch: {
              select: {
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
        attendanceAlertsEnabled: true
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
      if (!shouldQueueStudentAttendanceStatus(settings.studentAttendanceNotificationMode, record.status)) {
        result.skippedStatus += 1;
        continue;
      }

      const guardian = record.student.guardianLinks[0]?.guardian ?? null;
      if (!guardian) {
        result.skippedNoGuardian += 1;
        continue;
      }

      const preference = await deps.loadCommunicationPreference({
        tenantId: record.tenantId,
        branchId: record.branchId,
        guardianId: guardian.id
      });
      if (!preference?.whatsappEnabled || !preference.attendanceAlertsEnabled) {
        result.skippedNoConsent += 1;
        continue;
      }
      if (!preference.whatsappNumber) {
        result.skippedNoPhone += 1;
        continue;
      }

      const institution = record.classSection.branch.institution;
      const queueResult = await deps.queueOutbox({
        tenantId: record.tenantId,
        branchId: record.branchId,
        academicYearId: record.academicYearId,
        channel: "WHATSAPP",
        templateKey: WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT,
        recipientType: "GUARDIAN",
        recipientId: guardian.id,
        recipientPhone: preference.whatsappNumber,
        payload: buildStudentAttendanceTemplatePayload({
          studentName: personName(record.student),
          classSection: record.classSection.displayName,
          attendanceStatus: record.status,
          attendanceDate: toDateOnlyString(record.attendanceDate),
          institutionName: institution.displayName ?? institution.name
        }),
        idempotencyKey: `student-daily-attendance:${record.tenantId}:${record.id}:${record.status}`
      });
      if (queueResult.status === "queued") result.queued += 1;
      if (queueResult.status === "alreadyQueued") result.alreadyQueued += 1;
    }

    return result;
  } catch {
    return { ...result, failed: result.failed + 1 };
  }
}
