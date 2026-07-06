export const WHATSAPP_TEMPLATE_KEYS = {
  STUDENT_DAILY_ATTENDANCE_ALERT: "student_daily_attendance_alert",
  STAFF_MONTHLY_ATTENDANCE_SUMMARY: "staff_monthly_attendance_summary"
} as const;

export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[keyof typeof WHATSAPP_TEMPLATE_KEYS];

export type StudentAttendanceNotificationMode = "DISABLED" | "EXCEPTION_ONLY" | "ALL_STATUSES";
export type StudentAttendanceNotificationStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "EXCUSED"
  | "NOT_MARKED";

export type StaffMonthlySummaryPayloadInput = {
  staffName: string;
  month: string;
  presentDays: number;
  lateDays: number;
  halfDayDays: number;
  leaveDays: number;
  absentDays: number;
  institutionName: string;
};

const exceptionStatuses = new Set<StudentAttendanceNotificationStatus>([
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE"
]);

const forbiddenPayloadKeys = [
  "tenantId",
  "actorUserId",
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "qrToken",
  "rawQrToken",
  "remarks",
  "medicalRemarks",
  "teacherRemarks"
];

export function shouldQueueStudentAttendanceStatus(
  mode: StudentAttendanceNotificationMode,
  status: StudentAttendanceNotificationStatus
) {
  if (mode === "DISABLED") return false;
  if (mode === "ALL_STATUSES") return status !== "NOT_MARKED";
  return exceptionStatuses.has(status);
}

export function formatAttendanceStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildStudentAttendanceTemplatePayload(input: {
  studentName: string;
  classSection: string;
  attendanceStatus: StudentAttendanceNotificationStatus;
  attendanceDate: string;
  institutionName: string;
}) {
  return assertSafeNotificationPayload({
    student_name: input.studentName,
    class_section: input.classSection,
    attendance_status: formatAttendanceStatus(input.attendanceStatus),
    attendance_date: input.attendanceDate,
    institution_name: input.institutionName
  });
}

export function buildStaffMonthlySummaryTemplatePayload(input: StaffMonthlySummaryPayloadInput) {
  return assertSafeNotificationPayload({
    staff_name: input.staffName,
    month: input.month,
    present_days: input.presentDays,
    late_days: input.lateDays,
    half_day_days: input.halfDayDays,
    leave_days: input.leaveDays,
    absent_days: input.absentDays,
    institution_name: input.institutionName
  });
}

export function assertSafeNotificationPayload<T extends Record<string, string | number>>(payload: T): T {
  for (const key of Object.keys(payload)) {
    if (forbiddenPayloadKeys.includes(key)) {
      throw new Error(`FORBIDDEN_NOTIFICATION_PAYLOAD_KEY:${key}`);
    }
  }
  return payload;
}
