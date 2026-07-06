const STAFF_ATTENDANCE_QR_PAYLOAD_TYPE = "STAFF_ATTENDANCE_QR";

export type StaffQrPayloadParseResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

function looksLikeJson(value: string) {
  return value.startsWith("{") || value.startsWith("[");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseStaffAttendanceQrPayload(value: string): StaffQrPayloadParseResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "QR payload is empty. Scan the staff attendance QR or use manual token entry." };
  }

  if (!looksLikeJson(trimmed)) {
    return { ok: true, token: trimmed };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "This QR code could not be read. Use the current staff attendance QR." };
  }

  if (!isRecord(payload)) {
    return { ok: false, error: "This QR code is not a valid staff attendance QR." };
  }

  const payloadType = payload.type;
  const token = payload.token;
  if (payloadType !== STAFF_ATTENDANCE_QR_PAYLOAD_TYPE || typeof token !== "string") {
    return { ok: false, error: "This QR code is not a valid staff attendance QR." };
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return { ok: false, error: "This QR code does not include a valid attendance token." };
  }

  return { ok: true, token: trimmedToken };
}

export function extractStaffQrToken(value: string) {
  const result = parseStaffAttendanceQrPayload(value);
  return result.ok ? result.token : "";
}
