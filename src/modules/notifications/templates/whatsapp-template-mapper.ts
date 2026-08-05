export const WHATSAPP_TEMPLATE_KEYS = {
  STUDENT_DAILY_ATTENDANCE_ALERT: "student_daily_attendance_alert",
  STAFF_WEEKLY_ATTENDANCE_SUMMARY: "staff_weekly_attendance_summary",
  STAFF_MONTHLY_ATTENDANCE_SUMMARY: "staff_monthly_attendance_summary",
  STAFF_LEAVE_STATUS_UPDATE: "staff_leave_status_update"
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
  workingDays: number;
  markedDays: number;
  presentDays: number;
  lateDays: number;
  halfDayDays: number;
  leaveDays: number;
  absentDays: number;
  notMarkedDays: number;
  weekOffDays: number;
  holidayDays: number;
  totalWorkingMinutes: number;
  institutionName: string;
};

export type StaffWeeklySummaryPayloadInput = Omit<StaffMonthlySummaryPayloadInput, "month"> & {
  week: string;
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
  scholarNumber: string;
  classSection: string;
  attendanceStatus: StudentAttendanceNotificationStatus;
  attendanceDate: string;
  attendanceMarkingTime: string;
  institutionName: string;
}) {
  return assertSafeNotificationPayload({
    student_name: input.studentName,
    scholar_number: input.scholarNumber,
    class_section: input.classSection,
    attendance_status: formatAttendanceStatus(input.attendanceStatus),
    attendance_date: input.attendanceDate,
    attendance_marking_time: input.attendanceMarkingTime,
    institution_name: input.institutionName
  });
}

export function buildStaffMonthlySummaryTemplatePayload(input: StaffMonthlySummaryPayloadInput) {
  return assertSafeNotificationPayload({
    staff_name: input.staffName,
    month: input.month,
    working_days: input.workingDays,
    marked_days: input.markedDays,
    present_days: input.presentDays,
    late_days: input.lateDays,
    half_day_days: input.halfDayDays,
    leave_days: input.leaveDays,
    absent_days: input.absentDays,
    not_marked_days: input.notMarkedDays,
    week_off_days: input.weekOffDays,
    holiday_days: input.holidayDays,
    total_working_minutes: input.totalWorkingMinutes,
    institution_name: input.institutionName
  });
}

export function buildStaffWeeklySummaryTemplatePayload(input: StaffWeeklySummaryPayloadInput) {
  return assertSafeNotificationPayload({
    staff_name: input.staffName,
    week: input.week,
    working_days: input.workingDays,
    marked_days: input.markedDays,
    present_days: input.presentDays,
    late_days: input.lateDays,
    half_day_days: input.halfDayDays,
    leave_days: input.leaveDays,
    absent_days: input.absentDays,
    not_marked_days: input.notMarkedDays,
    week_off_days: input.weekOffDays,
    holiday_days: input.holidayDays,
    total_working_minutes: input.totalWorkingMinutes,
    institution_name: input.institutionName
  });
}

export function buildStaffLeaveStatusTemplatePayload(input: {
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  institutionName: string;
}) {
  return assertSafeNotificationPayload({
    staff_name: input.staffName,
    leave_type: input.leaveType,
    start_date: input.startDate,
    end_date: input.endDate,
    total_days: input.totalDays,
    application_status: formatAttendanceStatus(input.status),
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
