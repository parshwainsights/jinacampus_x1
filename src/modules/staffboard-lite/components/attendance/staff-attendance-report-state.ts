export const STAFF_ATTENDANCE_REPORT_STATUS_OPTIONS = [
  "",
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "WEEK_OFF",
  "HOLIDAY",
  "NOT_MARKED"
] as const;

export const STAFF_ATTENDANCE_REPORT_TYPE_OPTIONS = [
  "",
  "TEACHER",
  "ADMIN",
  "ACCOUNTANT",
  "LIBRARIAN",
  "DRIVER",
  "HELPER",
  "SECURITY",
  "PEON",
  "CLEANING_STAFF",
  "MANAGEMENT",
  "OTHER"
] as const;

function indiaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: values.get("year") ?? "2026",
    month: values.get("month") ?? "01",
    day: values.get("day") ?? "01"
  };
}

export function todayIndiaDateString() {
  const parts = indiaDateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthStartIndiaDateString() {
  const parts = indiaDateParts();
  return `${parts.year}-${parts.month}-01`;
}

export function currentIndiaMonthYear() {
  const parts = indiaDateParts();
  return {
    month: Number(parts.month),
    year: Number(parts.year)
  };
}

export function formatStaffAttendanceReportDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
