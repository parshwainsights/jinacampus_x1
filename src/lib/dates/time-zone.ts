export const DEFAULT_INSTITUTION_TIME_ZONE = "Asia/Kolkata";

export type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  isoWeekday: number;
};

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value.trim() }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(value: string | null | undefined) {
  return isValidTimeZone(value) ? value.trim() : DEFAULT_INSTITUTION_TIME_ZONE;
}

export function getZonedDateTimeParts(
  date: Date,
  requestedTimeZone: string | null | undefined
): ZonedDateTimeParts {
  const timeZone = safeTimeZone(requestedTimeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get("year"));
  const month = Number(values.get("month"));
  const day = Number(values.get("day"));
  const utcWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return {
    year,
    month,
    day,
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    second: Number(values.get("second")),
    isoWeekday: utcWeekday === 0 ? 7 : utcWeekday
  };
}

export function dateOnlyInTimeZone(date: Date, timeZone?: string | null) {
  const parts = getZonedDateTimeParts(date, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function dateOnlyStringInTimeZone(date: Date, timeZone?: string | null) {
  return dateOnlyInTimeZone(date, timeZone).toISOString().slice(0, 10);
}

export function formatDateInTimeZone(
  date: Date,
  timeZone?: string | null,
  options: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
    timeZone: safeTimeZone(timeZone)
  }).format(date);
}

export function formatTimeInTimeZone(
  date: Date,
  timeZone?: string | null,
  options: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
    timeZone: safeTimeZone(timeZone)
  }).format(date);
}

export function formatDateTimeInTimeZone(date: Date, timeZone?: string | null) {
  return `${formatDateInTimeZone(date, timeZone)}, ${formatTimeInTimeZone(date, timeZone)}`;
}

export function hasReachedLocalTime(
  date: Date,
  timeZone: string | null | undefined,
  hhmm: string
) {
  const [hour, minute] = hhmm.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
  const parts = getZonedDateTimeParts(date, timeZone);
  return parts.hour > hour || (parts.hour === hour && parts.minute >= minute);
}

export function shiftDateOnly(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function previousCompletedDaysRange(
  now: Date,
  timeZone: string | null | undefined,
  dayCount: number
) {
  const today = dateOnlyInTimeZone(now, timeZone);
  return {
    startDate: shiftDateOnly(today, -dayCount),
    endDate: shiftDateOnly(today, -1)
  };
}

export function previousCalendarMonth(
  now: Date,
  timeZone: string | null | undefined
) {
  const parts = getZonedDateTimeParts(now, timeZone);
  const monthStart = new Date(Date.UTC(parts.year, parts.month - 1, 1));
  const previousMonthEnd = shiftDateOnly(monthStart, -1);
  return {
    year: previousMonthEnd.getUTCFullYear(),
    month: previousMonthEnd.getUTCMonth() + 1
  };
}
