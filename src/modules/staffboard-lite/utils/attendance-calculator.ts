export type StaffAttendanceCheckInStatus = "PRESENT" | "LATE";
export type StaffAttendanceCheckOutStatus = "PRESENT" | "HALF_DAY";
export type StaffAttendanceCalculatedStatus = StaffAttendanceCheckInStatus | StaffAttendanceCheckOutStatus;

export type StaffAttendanceCalculationSettingsInput = {
  staffLateAfterTime?: string | null;
  staffHalfDayBeforeMinutes?: number | null;
  staffMinimumWorkingMinutes?: number | null;
  timeZone?: string | null;
};

export type StaffAttendanceCalculationSettings = {
  staffLateAfterTime: string;
  staffHalfDayBeforeMinutes: number;
  staffMinimumWorkingMinutes: number;
  timeZone: string;
};

export const DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS: StaffAttendanceCalculationSettings = {
  staffLateAfterTime: "09:30",
  staffHalfDayBeforeMinutes: 240,
  staffMinimumWorkingMinutes: 480,
  timeZone: "Asia/Kolkata"
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeTimeZone(value: string | null | undefined) {
  const timeZone = value?.trim() || DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS.timeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS.timeZone;
  }
}

function normalizeTime(value: string | null | undefined, fallback: string) {
  const time = value?.trim() || fallback;
  return timePattern.test(time) ? time : fallback;
}

function positiveIntegerOrDefault(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  return {
    hour: Number(valueByType.get("hour")),
    minute: Number(valueByType.get("minute")),
    second: Number(valueByType.get("second")),
    millisecond: date.getMilliseconds()
  };
}

export function resolveStaffAttendanceCalculationSettings(
  input: StaffAttendanceCalculationSettingsInput = {}
): StaffAttendanceCalculationSettings {
  const staffHalfDayBeforeMinutes = positiveIntegerOrDefault(
    input.staffHalfDayBeforeMinutes,
    DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS.staffHalfDayBeforeMinutes
  );
  const requestedFullDayMinutes = positiveIntegerOrDefault(
    input.staffMinimumWorkingMinutes,
    DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS.staffMinimumWorkingMinutes
  );

  return {
    staffLateAfterTime: normalizeTime(
      input.staffLateAfterTime,
      DEFAULT_STAFF_ATTENDANCE_CALCULATION_SETTINGS.staffLateAfterTime
    ),
    staffHalfDayBeforeMinutes,
    staffMinimumWorkingMinutes: Math.max(requestedFullDayMinutes, staffHalfDayBeforeMinutes),
    timeZone: safeTimeZone(input.timeZone)
  };
}

export function calculateCheckInStatus(input: {
  checkInAt: Date;
  settings?: StaffAttendanceCalculationSettingsInput;
}): StaffAttendanceCheckInStatus {
  const settings = resolveStaffAttendanceCalculationSettings(input.settings);
  const threshold = parseTime(settings.staffLateAfterTime);
  const checkIn = zonedParts(input.checkInAt, settings.timeZone);
  const isLate =
    checkIn.hour > threshold.hour ||
    (checkIn.hour === threshold.hour && checkIn.minute > threshold.minute) ||
    (checkIn.hour === threshold.hour &&
      checkIn.minute === threshold.minute &&
      (checkIn.second > 0 || checkIn.millisecond > 0));

  return isLate ? "LATE" : "PRESENT";
}

export function calculateWorkingMinutes(checkInAt: Date, checkOutAt: Date) {
  return Math.max(0, Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60000));
}

export function calculateCheckOutStatus(input: {
  workingMinutes: number;
  settings?: StaffAttendanceCalculationSettingsInput;
}): StaffAttendanceCheckOutStatus {
  const settings = resolveStaffAttendanceCalculationSettings(input.settings);
  if (input.workingMinutes < settings.staffHalfDayBeforeMinutes) return "HALF_DAY";
  if (input.workingMinutes >= settings.staffMinimumWorkingMinutes) return "PRESENT";
  return "HALF_DAY";
}

export function calculateFinalAttendanceStatus(input: {
  checkInStatus?: StaffAttendanceCheckInStatus | null;
  checkOutStatus?: StaffAttendanceCheckOutStatus | null;
}): StaffAttendanceCalculatedStatus {
  if (input.checkOutStatus) return input.checkOutStatus;
  if (input.checkInStatus === "LATE") return "LATE";
  if (input.checkInStatus === "PRESENT") return "PRESENT";
  return "PRESENT";
}
