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

function institutionalDateParts(date = new Date(), timeZone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
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

export function todayIndiaDateString(timeZone?: string | null) {
  const parts = institutionalDateParts(new Date(), timeZone ?? "Asia/Kolkata");
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthStartIndiaDateString(timeZone?: string | null) {
  const parts = institutionalDateParts(new Date(), timeZone ?? "Asia/Kolkata");
  return `${parts.year}-${parts.month}-01`;
}

export function currentIndiaMonthYear(timeZone?: string | null) {
  const parts = institutionalDateParts(new Date(), timeZone ?? "Asia/Kolkata");
  return {
    month: Number(parts.month),
    year: Number(parts.year)
  };
}

export function formatStaffAttendanceReportDate(value?: string | null, _timeZone = "Asia/Kolkata") {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (![year, month, day].every(Number.isInteger)) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
