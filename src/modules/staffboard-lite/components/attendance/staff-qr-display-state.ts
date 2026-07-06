export const STAFF_QR_PURPOSE_OPTIONS = [
  { value: "CHECK_IN", label: "Check-in" },
  { value: "CHECK_OUT", label: "Check-out" }
] as const;

export type StaffQrPurposeOption = (typeof STAFF_QR_PURPOSE_OPTIONS)[number]["value"];

export function getSecondsRemaining(validUntil: string, now = new Date()) {
  const expiresAt = new Date(validUntil).getTime();
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(0, Math.ceil((expiresAt - now.getTime()) / 1000));
}

export function isQrExpired(validUntil: string, now = new Date()) {
  return getSecondsRemaining(validUntil, now) === 0;
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatPurpose(value: StaffQrPurposeOption) {
  return value === "CHECK_IN" ? "Check-in" : "Check-out";
}

export function formatQrDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}
