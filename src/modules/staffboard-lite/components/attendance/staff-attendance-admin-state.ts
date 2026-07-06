export const STAFF_ATTENDANCE_STATUS_OPTIONS = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "WEEK_OFF",
  "HOLIDAY",
  "NOT_MARKED"
] as const;

export const STAFF_ATTENDANCE_CORRECTION_STATUS_OPTIONS = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "WEEK_OFF",
  "HOLIDAY"
] as const;

export const STAFF_TYPE_FILTER_OPTIONS = [
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

export function formatStaffAttendanceLabel(value: string) {
  return value
    .split("_")
    .map((part) => {
      if (part === "QR") return "QR";
      if (part === "ID") return "ID";
      return part.charAt(0) + part.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatStaffAttendanceDateTime(value?: string | null) {
  if (!value) return "-";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata"
  }).formatToParts(new Date(value));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("day") ?? "--"} ${values.get("month") ?? "---"}, ${values.get("hour") ?? "--"}:${values.get("minute") ?? "--"}`;
}

export function formatStaffAttendanceDate(value?: string | null) {
  if (!value) return "-";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).formatToParts(new Date(value));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("day") ?? "--"} ${values.get("month") ?? "---"} ${values.get("year") ?? "----"}`;
}

export function formatWorkingMinutes(value?: number | null) {
  if (typeof value !== "number") return "-";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours > 0 ? `${hours}h ${minutes.toString().padStart(2, "0")}m` : `${minutes} min`;
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function staffAttendanceCorrectionErrorMessage(code: string, fallback: string) {
  if (code === "VALIDATION_ERROR") return "Check the correction fields and enter a reason.";
  if (code === "STAFF_ATTENDANCE_RECORD_NOT_FOUND") return "Attendance record was not found for your branch access.";
  if (code === "STAFF_ATTENDANCE_CHECK_OUT_BEFORE_CHECK_IN") return "Check-out time must be after check-in time.";
  if (code === "FORBIDDEN" || code.startsWith("FORBIDDEN_PERMISSION") || code.startsWith("FORBIDDEN_")) {
    return "You do not have permission to correct staff attendance.";
  }
  return fallback || "Unable to correct staff attendance.";
}

export function validateStaffAttendanceCorrectionDraft(input: {
  correctionReason: string;
  checkInAt?: string;
  checkOutAt?: string;
}) {
  if (input.correctionReason.trim().length < 5) {
    return "Enter a correction reason with at least 5 characters.";
  }

  if (input.checkInAt && input.checkOutAt) {
    const checkInAt = new Date(input.checkInAt);
    const checkOutAt = new Date(input.checkOutAt);
    if (checkOutAt < checkInAt) return "Check-out time must be after check-in time.";
  }

  return null;
}
