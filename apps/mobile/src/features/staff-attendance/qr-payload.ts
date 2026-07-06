const STAFF_ATTENDANCE_QR_PAYLOAD_TYPE = "STAFF_ATTENDANCE_QR";

export type StaffQrPayloadParseResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseStaffAttendanceQrPayload(value: string): StaffQrPayloadParseResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "QR payload is empty. Scan the staff attendance QR or use manual token entry." };
  }

  if (!trimmed.startsWith("{")) return { ok: true, token: trimmed };

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "This QR code is not a valid staff attendance QR. Please try again." };
  }

  if (!isRecord(payload)) {
    return { ok: false, error: "This QR code is not a valid staff attendance QR. Please try again." };
  }

  if (payload.type !== STAFF_ATTENDANCE_QR_PAYLOAD_TYPE || typeof payload.token !== "string") {
    return { ok: false, error: "This QR code is not a valid staff attendance QR. Please try again." };
  }

  const token = payload.token.trim();
  if (!token) {
    return { ok: false, error: "QR payload is empty. Scan the staff attendance QR or use manual token entry." };
  }

  return { ok: true, token };
}
