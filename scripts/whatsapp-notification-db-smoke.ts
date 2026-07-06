import { createHmac } from "node:crypto";
import type { Prisma, StudentAttendanceStatus } from "@prisma/client";
import { db } from "../src/lib/db";
import type { TenantContext } from "../src/lib/tenant/context";
import { submitDailyStudentAttendance } from "../src/modules/academia/services/student-attendance.service";
import { queueStudentAttendanceWhatsAppNotifications } from "../src/modules/notifications/services/attendance-whatsapp-notification.service";
import { processNotificationOutbox } from "../src/modules/notifications/services/notification-outbox.service";
import { queueStaffMonthlyAttendanceWhatsAppSummaries } from "../src/modules/notifications/services/staff-monthly-whatsapp-summary.service";
import { WHATSAPP_TEMPLATE_KEYS } from "../src/modules/notifications/templates/whatsapp-template-mapper";
import {
  handleWhatsAppWebhookStatus,
  verifyWhatsAppWebhookSignature
} from "../src/modules/notifications/webhooks/whatsapp-webhook.handler";

type SmokeStatus = "PASS" | "WARN";
type SmokeCheck = {
  name: string;
  status: SmokeStatus;
  details?: Record<string, string | number | boolean | null>;
};

type AttendanceSettingSnapshot = {
  studentAttendanceWhatsAppEnabled: boolean;
  studentAttendanceNotificationMode: "DISABLED" | "EXCEPTION_ONLY" | "ALL_STATUSES";
  staffMonthlySummaryWhatsAppEnabled: boolean;
  staffMonthlySummarySendDay: number;
  staffMonthlySummarySendTime: string;
};

type PreferenceSnapshot = {
  id: string;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  attendanceAlertsEnabled: boolean;
  monthlySummaryEnabled: boolean;
  consentCapturedAt: Date | null;
  consentSource: string | null;
};

const DEMO_TENANT_SLUG = "jinacampus-demo";
const DEMO_BRANCH_CODE = "MAIN";
const STUDENT_SMOKE_DATE = new Date(Date.UTC(2026, 7, 17));
const STAFF_SUMMARY_YEAR = 2026;
const STAFF_SUMMARY_MONTH = 6;
const checks: SmokeCheck[] = [];
const forbiddenPayloadKeyPattern = /password|passwordHash|tokenHash|qrToken|rawQrToken|medical|remark|actorUserId|tenantId/i;

function assertSmoke(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function recordPass(name: string, details?: SmokeCheck["details"]) {
  checks.push({ name, status: "PASS", details });
}

function recordWarn(name: string, details?: SmokeCheck["details"]) {
  checks.push({ name, status: "WARN", details });
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildTenantContext(input: {
  tenantId: string;
  tenantName: string;
  userId: string;
  userEmail: string;
  userType: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  academicYearId: string;
  academicYearName: string;
  institutionName: string;
  roleCodes: string[];
  roleLabels: string[];
}): TenantContext {
  return {
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    userId: input.userId,
    userEmail: input.userEmail,
    userType: input.userType,
    activeBranchId: input.branchId,
    activeBranchName: input.branchName,
    activeBranchCode: input.branchCode,
    accessibleBranchIds: [input.branchId],
    activeAcademicYearId: input.academicYearId,
    activeAcademicYearName: input.academicYearName,
    institutionName: input.institutionName,
    institutionDisplayName: input.institutionName,
    institutionLogoUrl: null,
    roleCodes: input.roleCodes,
    roleLabels: input.roleLabels,
    userAgent: "whatsapp-notification-db-smoke"
  };
}

async function verifyDatabaseShape() {
  const expectedTables = [
    "communication_preferences",
    "notification_templates",
    "notification_outbox",
    "notification_delivery_logs",
    "whatsapp_integration_settings"
  ];
  const tables = await db.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'communication_preferences',
        'notification_templates',
        'notification_outbox',
        'notification_delivery_logs',
        'whatsapp_integration_settings'
      )
  `;
  const foundTables = new Set(tables.map((row) => row.table_name));
  for (const table of expectedTables) assertSmoke(foundTables.has(table), `Missing table: ${table}`);

  const expectedEnums = [
    "CommunicationPreferenceOwnerType",
    "NotificationChannel",
    "NotificationRecipientType",
    "NotificationOutboxStatus",
    "NotificationDeliveryStatus",
    "WhatsAppProvider",
    "StudentAttendanceNotificationMode"
  ];
  const enums = await db.$queryRaw<Array<{ typname: string }>>`
    SELECT typname
    FROM pg_type
    WHERE typname IN (
      'CommunicationPreferenceOwnerType',
      'NotificationChannel',
      'NotificationRecipientType',
      'NotificationOutboxStatus',
      'NotificationDeliveryStatus',
      'WhatsAppProvider',
      'StudentAttendanceNotificationMode'
    )
  `;
  const foundEnums = new Set(enums.map((row) => row.typname));
  for (const enumName of expectedEnums) assertSmoke(foundEnums.has(enumName), `Missing enum: ${enumName}`);

  const expectedIndexes = [
    "notification_outbox_idempotencyKey_key",
    "communication_preferences_tenantId_ownerType_ownerId_key",
    "notification_templates_tenant_global_template_uidx",
    "notification_templates_tenant_branch_template_uidx",
    "whatsapp_integration_tenant_global_uidx",
    "whatsapp_integration_tenant_branch_uidx"
  ];
  const indexes = await db.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'notification_outbox_idempotencyKey_key',
        'communication_preferences_tenantId_ownerType_ownerId_key',
        'notification_templates_tenant_global_template_uidx',
        'notification_templates_tenant_branch_template_uidx',
        'whatsapp_integration_tenant_global_uidx',
        'whatsapp_integration_tenant_branch_uidx'
      )
  `;
  const foundIndexes = new Set(indexes.map((row) => row.indexname));
  for (const indexName of expectedIndexes) assertSmoke(foundIndexes.has(indexName), `Missing index: ${indexName}`);

  recordPass("database shape", {
    tables: expectedTables.length,
    enums: expectedEnums.length,
    indexes: expectedIndexes.length
  });
}

async function loadDemoContext() {
  const tenant = await db.tenant.findUnique({
    where: { slug: DEMO_TENANT_SLUG },
    select: { id: true, name: true }
  });
  assertSmoke(tenant, "Demo tenant not found.");

  const branch = await db.branch.findFirst({
    where: { tenantId: tenant.id, code: DEMO_BRANCH_CODE, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      code: true,
      institutionId: true,
      institution: { select: { name: true, displayName: true } }
    }
  });
  assertSmoke(branch, "Demo branch not found.");

  const academicYear = await db.academicYear.findFirst({
    where: { tenantId: tenant.id, institutionId: branch.institutionId, status: "ACTIVE", isActive: true },
    select: { id: true, name: true }
  });
  assertSmoke(academicYear, "Active academic year not found.");

  const adminUser = await db.user.findFirst({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      branchAccesses: { some: { branchId: branch.id, isActive: true } },
      roleAssignments: {
        some: {
          isActive: true,
          role: { code: { in: ["ADMIN", "PRINCIPAL", "TENANT_OWNER"] }, isActive: true }
        }
      }
    },
    select: {
      id: true,
      email: true,
      userType: true,
      roleAssignments: {
        where: { isActive: true },
        select: { role: { select: { code: true, name: true } } }
      }
    }
  });
  assertSmoke(adminUser, "Admin/principal smoke actor not found.");

  const ctx = buildTenantContext({
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: adminUser.id,
    userEmail: adminUser.email,
    userType: adminUser.userType,
    branchId: branch.id,
    branchName: branch.name,
    branchCode: branch.code,
    academicYearId: academicYear.id,
    academicYearName: academicYear.name,
    institutionName: branch.institution.displayName ?? branch.institution.name,
    roleCodes: adminUser.roleAssignments.map((assignment) => assignment.role.code),
    roleLabels: adminUser.roleAssignments.map((assignment) => assignment.role.name)
  });

  recordPass("demo context", {
    tenant: DEMO_TENANT_SLUG,
    branch: DEMO_BRANCH_CODE,
    academicYear: academicYear.name
  });

  return { tenant, branch, academicYear, ctx };
}

async function verifySeedData(tenantId: string, branchId: string) {
  const templates = await db.notificationTemplate.findMany({
    where: {
      tenantId,
      channel: "WHATSAPP",
      templateKey: {
        in: [
          WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT,
          WHATSAPP_TEMPLATE_KEYS.STAFF_MONTHLY_ATTENDANCE_SUMMARY
        ]
      },
      isActive: true
    },
    select: { templateKey: true }
  });
  assertSmoke(templates.length === 2, "Expected two active WhatsApp notification templates.");

  const setting = await db.attendanceSetting.findUnique({
    where: { branchId },
    select: {
      id: true,
      studentAttendanceWhatsAppEnabled: true,
      studentAttendanceNotificationMode: true,
      staffMonthlySummaryWhatsAppEnabled: true,
      staffMonthlySummarySendDay: true,
      staffMonthlySummarySendTime: true
    }
  });
  assertSmoke(setting, "Attendance settings missing for demo branch.");

  const integration = await db.whatsAppIntegrationSetting.findFirst({
    where: { tenantId, provider: "DRY_RUN" },
    select: { isEnabled: true, accessTokenEncrypted: true }
  });
  assertSmoke(integration, "DRY_RUN WhatsApp integration seed missing.");
  assertSmoke(!integration.accessTokenEncrypted, "Dry-run integration must not contain an access token.");

  const guardianPreferences = await db.communicationPreference.count({ where: { tenantId, ownerType: "GUARDIAN" } });
  const staffPreferences = await db.communicationPreference.count({ where: { tenantId, ownerType: "STAFF" } });
  assertSmoke(guardianPreferences > 0, "Guardian communication preferences missing.");
  assertSmoke(staffPreferences > 0, "Staff communication preferences missing.");

  recordPass("seed data", {
    templates: templates.length,
    guardianPreferences,
    staffPreferences,
    dryRunIntegrationEnabled: integration.isEnabled
  });

  return setting;
}

async function loadStudentSmokeInputs(input: { tenantId: string; branchId: string; academicYearId: string }) {
  const classSections = await db.classSection.findMany({
    where: { tenantId: input.tenantId, branchId: input.branchId, academicYearId: input.academicYearId, status: "ACTIVE" },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" }
  });
  assertSmoke(classSections.length > 0, "No active class-section found for student notification smoke.");

  for (const classSection of classSections) {
    const enrollments = await db.enrollment.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        academicYearId: input.academicYearId,
        classSectionId: classSection.id,
        status: "ACTIVE",
        student: { status: "ACTIVE" }
      },
      select: {
        id: true,
        studentId: true,
        rollNumber: true,
        student: {
          select: {
            guardianLinks: {
              where: { isPrimary: true },
              select: { guardian: { select: { id: true } } },
              take: 1
            }
          }
        }
      },
      orderBy: [{ rollNumber: "asc" }, { studentId: "asc" }]
    });
    if (enrollments.length >= 6 && enrollments.slice(0, 6).every((enrollment) => enrollment.student.guardianLinks[0]?.guardian.id)) {
      return { classSection, enrollments };
    }
  }

  throw new Error("Need one active class-section with at least six enrolled students and primary guardians for notification smoke.");
}

async function snapshotPreferences(tenantId: string, ownerIds: string[]) {
  const preferences = await db.communicationPreference.findMany({
    where: { tenantId, ownerId: { in: ownerIds } },
    select: {
      id: true,
      whatsappEnabled: true,
      whatsappNumber: true,
      attendanceAlertsEnabled: true,
      monthlySummaryEnabled: true,
      consentCapturedAt: true,
      consentSource: true
    }
  });
  return new Map(preferences.map((preference) => [preference.id, preference]));
}

async function restorePreferences(preferences: Map<string, PreferenceSnapshot>) {
  for (const preference of preferences.values()) {
    await db.communicationPreference.update({
      where: { id: preference.id },
      data: {
        whatsappEnabled: preference.whatsappEnabled,
        whatsappNumber: preference.whatsappNumber,
        attendanceAlertsEnabled: preference.attendanceAlertsEnabled,
        monthlySummaryEnabled: preference.monthlySummaryEnabled,
        consentCapturedAt: preference.consentCapturedAt,
        consentSource: preference.consentSource
      }
    });
  }
}

async function runStudentSmoke(input: {
  tenantId: string;
  branchId: string;
  academicYearId: string;
  ctx: TenantContext;
}) {
  const { classSection, enrollments } = await loadStudentSmokeInputs(input);
  const smokeStudents = enrollments.slice(0, 6);
  const guardianIds = smokeStudents.map((enrollment) => enrollment.student.guardianLinks[0]?.guardian.id).filter(Boolean);
  assertSmoke(guardianIds.length === 6, "Guardian setup incomplete for student smoke.");

  const originalPreferences = await snapshotPreferences(input.tenantId, guardianIds);
  const statusByIndex: StudentAttendanceStatus[] = ["ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "PRESENT", "ABSENT"];

  try {
    for (let index = 0; index < guardianIds.length; index += 1) {
      await db.communicationPreference.updateMany({
        where: { tenantId: input.tenantId, ownerType: "GUARDIAN", ownerId: guardianIds[index] },
        data: {
          whatsappEnabled: index !== 5,
          whatsappNumber: `00000000010${index + 1}`,
          attendanceAlertsEnabled: index !== 5,
          consentCapturedAt: new Date(),
          consentSource: "local-db-smoke"
        }
      });
    }

    const entries = enrollments.map((enrollment, index) => ({
      studentId: enrollment.studentId,
      status: statusByIndex[index] ?? "PRESENT",
      remarks: "WhatsApp notification DB smoke"
    }));

    const submission = await submitDailyStudentAttendance(input.ctx, {
      classSectionId: classSection.id,
      attendanceDate: toDateOnlyString(STUDENT_SMOKE_DATE),
      sessionType: "FULL_DAY",
      entries
    });
    assertSmoke(submission.submittedCount === enrollments.length, "Attendance submission did not cover all active students.");

    const records = await db.studentAttendanceRecord.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        academicYearId: input.academicYearId,
        classSectionId: classSection.id,
        attendanceDate: STUDENT_SMOKE_DATE,
        sessionType: "FULL_DAY",
        studentId: { in: smokeStudents.map((enrollment) => enrollment.studentId) }
      },
      select: { id: true, studentId: true, status: true },
      orderBy: { studentId: "asc" }
    });
    const studentIdempotencyKeys = records.map((record) => `student-daily-attendance:${input.tenantId}:${record.id}:${record.status}`);
    await db.notificationOutbox.deleteMany({ where: { idempotencyKey: { in: studentIdempotencyKeys } } });

    await db.attendanceSetting.update({
      where: { branchId: input.branchId },
      data: {
        studentAttendanceWhatsAppEnabled: true,
        studentAttendanceNotificationMode: "EXCEPTION_ONLY"
      }
    });

    const queueResult = await queueStudentAttendanceWhatsAppNotifications({
      tenantId: input.tenantId,
      branchId: input.branchId,
      academicYearId: input.academicYearId,
      classSectionId: classSection.id,
      attendanceDate: STUDENT_SMOKE_DATE,
      attendanceRecordIds: records.map((record) => record.id)
    });
    assertSmoke(queueResult.queued === 4, "Student EXCEPTION_ONLY queue count mismatch.");
    assertSmoke(queueResult.skippedStatus >= 1, "PRESENT student was not skipped in EXCEPTION_ONLY mode.");
    assertSmoke(queueResult.skippedNoConsent >= 1, "Guardian without consent was not skipped.");

    const noPhoneRecord = records.find((record) => record.studentId === smokeStudents[0].studentId && record.status === "ABSENT");
    assertSmoke(noPhoneRecord, "No ABSENT record available for no-phone notification smoke.");
    const noPhoneIdempotencyKey = `student-daily-attendance:${input.tenantId}:${noPhoneRecord.id}:${noPhoneRecord.status}`;
    await db.notificationOutbox.deleteMany({ where: { idempotencyKey: noPhoneIdempotencyKey } });
    await db.communicationPreference.updateMany({
      where: { tenantId: input.tenantId, ownerType: "GUARDIAN", ownerId: guardianIds[0] },
      data: { whatsappEnabled: true, attendanceAlertsEnabled: true, whatsappNumber: null }
    });
    const noPhoneQueueResult = await queueStudentAttendanceWhatsAppNotifications({
      tenantId: input.tenantId,
      branchId: input.branchId,
      academicYearId: input.academicYearId,
      classSectionId: classSection.id,
      attendanceDate: STUDENT_SMOKE_DATE,
      attendanceRecordIds: [noPhoneRecord.id]
    });
    assertSmoke(noPhoneQueueResult.skippedNoPhone === 1, "Guardian without WhatsApp number was not skipped.");
    await db.communicationPreference.updateMany({
      where: { tenantId: input.tenantId, ownerType: "GUARDIAN", ownerId: guardianIds[0] },
      data: { whatsappEnabled: true, attendanceAlertsEnabled: true, whatsappNumber: "000000000101" }
    });
    const recreateNoPhoneRowResult = await queueStudentAttendanceWhatsAppNotifications({
      tenantId: input.tenantId,
      branchId: input.branchId,
      academicYearId: input.academicYearId,
      classSectionId: classSection.id,
      attendanceDate: STUDENT_SMOKE_DATE,
      attendanceRecordIds: [noPhoneRecord.id]
    });
    assertSmoke(recreateNoPhoneRowResult.queued === 1, "No-phone recovery queue did not recreate the positive outbox row.");

    const secondQueueResult = await queueStudentAttendanceWhatsAppNotifications({
      tenantId: input.tenantId,
      branchId: input.branchId,
      academicYearId: input.academicYearId,
      classSectionId: classSection.id,
      attendanceDate: STUDENT_SMOKE_DATE,
      attendanceRecordIds: records.map((record) => record.id)
    });
    assertSmoke(secondQueueResult.alreadyQueued === 4, "Student notification idempotency did not return alreadyQueued.");

    const outboxRows = await db.notificationOutbox.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        idempotencyKey: { in: studentIdempotencyKeys },
        templateKey: WHATSAPP_TEMPLATE_KEYS.STUDENT_DAILY_ATTENDANCE_ALERT
      },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        academicYearId: true,
        channel: true,
        templateKey: true,
        recipientType: true,
        payloadJson: true,
        status: true,
        idempotencyKey: true
      }
    });
    assertSmoke(outboxRows.length === 4, "Student notification outbox row count mismatch.");
    assertSmoke(outboxRows.every((row) => row.channel === "WHATSAPP" && row.recipientType === "GUARDIAN" && row.status === "QUEUED"), "Student outbox rows have unexpected channel/recipient/status.");
    assertSmoke(outboxRows.every((row) => row.tenantId === input.tenantId && row.branchId === input.branchId && row.academicYearId === input.academicYearId), "Student outbox tenant/branch/year scope mismatch.");
    assertSmoke(outboxRows.every((row) => !forbiddenPayloadKeyPattern.test(safeJson(row.payloadJson))), "Student outbox payload contains a forbidden field.");

    recordPass("student attendance notification smoke", {
      submitted: submission.submittedCount,
      queued: queueResult.queued,
      alreadyQueued: secondQueueResult.alreadyQueued,
      skippedStatus: queueResult.skippedStatus,
      skippedNoConsent: queueResult.skippedNoConsent,
      skippedNoPhone: noPhoneQueueResult.skippedNoPhone
    });

    return outboxRows.map((row) => ({ id: row.id, idempotencyKey: row.idempotencyKey }));
  } finally {
    await restorePreferences(originalPreferences);
  }
}

async function runStaffSmoke(input: { tenantId: string; branchId: string }) {
  const activeStaff = await db.staffProfile.findMany({
    where: { tenantId: input.tenantId, branchId: input.branchId, employmentStatus: "ACTIVE" },
    select: { id: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
  });
  assertSmoke(activeStaff.length >= 3, "Need at least three active staff profiles for notification smoke.");

  const touchedStaff = activeStaff.slice(0, 3);
  const originalPreferences = await snapshotPreferences(input.tenantId, touchedStaff.map((staff) => staff.id));
  const staffIdempotencyKeys = activeStaff.map((staff) => `staff-monthly-summary:${input.tenantId}:${staff.id}:${STAFF_SUMMARY_YEAR}:${STAFF_SUMMARY_MONTH}`);

  try {
    for (let index = 0; index < touchedStaff.length; index += 1) {
      await db.communicationPreference.updateMany({
        where: { tenantId: input.tenantId, ownerType: "STAFF", ownerId: touchedStaff[index].id },
        data: {
          whatsappEnabled: index !== 1,
          whatsappNumber: index === 2 ? null : `00000000020${index + 1}`,
          monthlySummaryEnabled: index !== 1,
          consentCapturedAt: new Date(),
          consentSource: "local-db-smoke"
        }
      });
    }

    await db.notificationOutbox.deleteMany({ where: { idempotencyKey: { in: staffIdempotencyKeys } } });
    await db.attendanceSetting.update({
      where: { branchId: input.branchId },
      data: { staffMonthlySummaryWhatsAppEnabled: true }
    });

    const queueResult = await queueStaffMonthlyAttendanceWhatsAppSummaries({
      tenantId: input.tenantId,
      branchId: input.branchId,
      year: STAFF_SUMMARY_YEAR,
      month: STAFF_SUMMARY_MONTH
    });
    assertSmoke(queueResult.queued === 1, "Staff monthly summary queue count mismatch.");
    assertSmoke(queueResult.skippedNoConsent >= 1, "Staff without consent was not skipped.");
    assertSmoke(queueResult.skippedNoPhone >= 1, "Staff without WhatsApp number was not skipped.");

    const secondQueueResult = await queueStaffMonthlyAttendanceWhatsAppSummaries({
      tenantId: input.tenantId,
      branchId: input.branchId,
      year: STAFF_SUMMARY_YEAR,
      month: STAFF_SUMMARY_MONTH
    });
    assertSmoke(secondQueueResult.alreadyQueued === 1, "Staff monthly summary idempotency did not return alreadyQueued.");

    const outboxRows = await db.notificationOutbox.findMany({
      where: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        idempotencyKey: { in: staffIdempotencyKeys },
        templateKey: WHATSAPP_TEMPLATE_KEYS.STAFF_MONTHLY_ATTENDANCE_SUMMARY
      },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        channel: true,
        templateKey: true,
        recipientType: true,
        payloadJson: true,
        status: true,
        idempotencyKey: true
      }
    });
    assertSmoke(outboxRows.length === 1, "Staff monthly summary outbox row count mismatch.");
    assertSmoke(outboxRows.every((row) => row.channel === "WHATSAPP" && row.recipientType === "STAFF" && row.status === "QUEUED"), "Staff outbox rows have unexpected channel/recipient/status.");
    assertSmoke(outboxRows.every((row) => row.tenantId === input.tenantId && row.branchId === input.branchId), "Staff outbox tenant/branch scope mismatch.");
    assertSmoke(outboxRows.every((row) => !forbiddenPayloadKeyPattern.test(safeJson(row.payloadJson))), "Staff outbox payload contains a forbidden field.");

    recordPass("staff monthly summary notification smoke", {
      checked: queueResult.checked,
      queued: queueResult.queued,
      alreadyQueued: secondQueueResult.alreadyQueued,
      skippedNoConsent: queueResult.skippedNoConsent,
      skippedNoPhone: queueResult.skippedNoPhone
    });

    return outboxRows.map((row) => ({ id: row.id, idempotencyKey: row.idempotencyKey }));
  } finally {
    await restorePreferences(originalPreferences);
  }
}

async function runOutboxProcessorSmoke(input: { tenantId: string; branchId: string; outboxIds: string[] }) {
  const queuedBefore = await db.notificationOutbox.count({
    where: { tenantId: input.tenantId, branchId: input.branchId, id: { in: input.outboxIds }, status: "QUEUED" }
  });
  assertSmoke(queuedBefore === input.outboxIds.length, "Expected all smoke outbox rows to be QUEUED before processing.");

  const previousMode = process.env.WHATSAPP_PROVIDER_MODE;
  process.env.WHATSAPP_PROVIDER_MODE = "DRY_RUN";
  try {
    const result = await processNotificationOutbox({ tenantId: input.tenantId, branchId: input.branchId, limit: 50 });
    const processedRows = await db.notificationOutbox.findMany({
      where: { id: { in: input.outboxIds }, tenantId: input.tenantId },
      select: { id: true, status: true, sentAt: true, failureReason: true }
    });
    const deliveryLogs = await db.notificationDeliveryLog.findMany({
      where: { tenantId: input.tenantId, outboxId: { in: input.outboxIds } },
      select: { provider: true, providerMessageId: true, status: true, errorMessage: true }
    });

    assertSmoke(processedRows.every((row) => row.status === "SENT" && row.sentAt && !row.failureReason), "Not all smoke outbox rows were marked SENT.");
    assertSmoke(deliveryLogs.filter((log) => log.status === "SENT").length >= input.outboxIds.length, "SENT delivery logs missing for dry-run processing.");
    assertSmoke(deliveryLogs.every((log) => log.provider === "DRY_RUN"), "Non-dry-run provider used during smoke.");
    assertSmoke(deliveryLogs.every((log) => !log.errorMessage || !/Bearer|access_token|token=/i.test(log.errorMessage)), "Delivery logs contain unsafe provider error output.");

    recordPass("outbox processor dry-run smoke", {
      requestedRows: input.outboxIds.length,
      processorProcessed: result.processed,
      processorSent: result.sent,
      deliveryLogs: deliveryLogs.length
    });

    const webhookTarget = deliveryLogs.find((log) => log.providerMessageId);
    assertSmoke(webhookTarget?.providerMessageId, "No dry-run provider message id available for webhook smoke.");
    return webhookTarget.providerMessageId;
  } finally {
    if (previousMode === undefined) {
      delete process.env.WHATSAPP_PROVIDER_MODE;
    } else {
      process.env.WHATSAPP_PROVIDER_MODE = previousMode;
    }
  }
}

async function runWebhookSmoke(input: { tenantId: string; providerMessageId: string }) {
  const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: input.providerMessageId, status: "delivered" }] } }] }] });
  const signature = `sha256=${createHmac("sha256", "local-smoke-secret").update(body).digest("hex")}`;
  assertSmoke(verifyWhatsAppWebhookSignature(body, signature, "local-smoke-secret"), "Webhook signature verification failed for valid signature.");
  assertSmoke(!verifyWhatsAppWebhookSignature(body, "sha256=invalid", "local-smoke-secret"), "Webhook signature verification accepted invalid signature.");

  const updateResult = await handleWhatsAppWebhookStatus({
    providerMessageId: input.providerMessageId,
    status: "DELIVERED",
    rawStatusJson: { id: input.providerMessageId, status: "delivered" }
  });
  assertSmoke(updateResult === "updated", "Webhook status update was not applied.");

  const ignoredResult = await handleWhatsAppWebhookStatus({
    providerMessageId: "unknown-local-smoke-provider-message",
    status: "DELIVERED"
  });
  assertSmoke(ignoredResult === "ignored", "Unknown provider message id was not ignored safely.");

  const deliveredLogCount = await db.notificationDeliveryLog.count({
    where: { tenantId: input.tenantId, providerMessageId: input.providerMessageId, status: "DELIVERED" }
  });
  assertSmoke(deliveredLogCount > 0, "Webhook delivery log was not recorded.");

  recordPass("webhook smoke", {
    validSignature: true,
    invalidSignatureRejected: true,
    updatedKnownMessage: true,
    ignoredUnknownMessage: true
  });
}

async function runTenantAndRbacSmoke(input: { tenantId: string; branchId: string; outboxIds: string[] }) {
  const scopedOutbox = await db.notificationOutbox.count({
    where: { id: { in: input.outboxIds }, tenantId: input.tenantId, branchId: input.branchId }
  });
  assertSmoke(scopedOutbox === input.outboxIds.length, "Smoke outbox rows are not tenant/branch scoped.");

  const tenantCount = await db.tenant.count();
  if (tenantCount <= 1) {
    recordWarn("multi-tenant negative fixture", { tenantCount, status: "pending additional fixture coverage" });
  } else {
    const crossTenantOutbox = await db.notificationOutbox.count({
      where: { id: { in: input.outboxIds }, NOT: { tenantId: input.tenantId } }
    });
    assertSmoke(crossTenantOutbox === 0, "Cross-tenant outbox rows found in smoke IDs.");
    recordPass("multi-tenant negative fixture", { tenantCount });
  }

  const roles = await db.role.findMany({
    where: { tenantId: input.tenantId, code: { in: ["ADMIN", "PRINCIPAL", "TEACHER", "STAFF"] } },
    select: {
      code: true,
      rolePermissions: {
        select: { permission: { select: { code: true } } }
      }
    }
  });
  const rolePermissions = new Map(roles.map((role) => [role.code, new Set(role.rolePermissions.map((entry) => entry.permission.code))]));
  for (const roleCode of ["ADMIN", "PRINCIPAL"]) {
    const permissions = rolePermissions.get(roleCode);
    assertSmoke(permissions?.has("notifications.settings.manage"), `${roleCode} missing notification settings permission.`);
    assertSmoke(permissions?.has("notifications.outbox.process"), `${roleCode} missing notification outbox process permission.`);
  }
  for (const roleCode of ["TEACHER", "STAFF"]) {
    const permissions = rolePermissions.get(roleCode);
    assertSmoke(!permissions?.has("notifications.settings.manage"), `${roleCode} must not manage notification settings.`);
    assertSmoke(!permissions?.has("notifications.outbox.process"), `${roleCode} must not process notification outbox.`);
  }

  recordPass("tenant branch and RBAC smoke", {
    scopedOutbox,
    adminPrincipalNotificationPermissions: true,
    teacherStaffDeniedNotificationGovernance: true
  });
}

async function main() {
  await verifyDatabaseShape();
  const { tenant, branch, academicYear, ctx } = await loadDemoContext();
  const originalSettings = await verifySeedData(tenant.id, branch.id);
  const settingSnapshot: AttendanceSettingSnapshot = {
    studentAttendanceWhatsAppEnabled: originalSettings.studentAttendanceWhatsAppEnabled,
    studentAttendanceNotificationMode: originalSettings.studentAttendanceNotificationMode,
    staffMonthlySummaryWhatsAppEnabled: originalSettings.staffMonthlySummaryWhatsAppEnabled,
    staffMonthlySummarySendDay: originalSettings.staffMonthlySummarySendDay,
    staffMonthlySummarySendTime: originalSettings.staffMonthlySummarySendTime
  };

  try {
    await db.attendanceSetting.update({
      where: { branchId: branch.id },
      data: {
        studentAttendanceWhatsAppEnabled: false,
        staffMonthlySummaryWhatsAppEnabled: false
      }
    });

    const studentRows = await runStudentSmoke({
      tenantId: tenant.id,
      branchId: branch.id,
      academicYearId: academicYear.id,
      ctx
    });
    const staffRows = await runStaffSmoke({ tenantId: tenant.id, branchId: branch.id });
    const outboxIds = [...studentRows, ...staffRows].map((row) => row.id);
    const providerMessageId = await runOutboxProcessorSmoke({ tenantId: tenant.id, branchId: branch.id, outboxIds });
    await runWebhookSmoke({ tenantId: tenant.id, providerMessageId });
    await runTenantAndRbacSmoke({ tenantId: tenant.id, branchId: branch.id, outboxIds });
  } finally {
    await db.attendanceSetting.update({
      where: { branchId: branch.id },
      data: settingSnapshot
    });
  }

  console.log(safeJson({
    status: "PASS",
    providerMode: "DRY_RUN",
    tenant: DEMO_TENANT_SLUG,
    checks
  }));
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown smoke failure";
    console.error(safeJson({ status: "FAIL", error: message, checks }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
