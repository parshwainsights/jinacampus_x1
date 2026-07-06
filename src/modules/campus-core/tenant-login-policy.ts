export const SCHOOL_LOGIN_ERROR_MESSAGE = "Invalid School ID, email, or password.";
export const TENANT_LOGIN_ERROR_MESSAGE = SCHOOL_LOGIN_ERROR_MESSAGE;
export const ADMINISTRATOR_LOGIN_ERROR_MESSAGE = "Invalid administrator credentials.";

export const SCHOOL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TENANT_SLUG_PATTERN = SCHOOL_ID_PATTERN;
export const SCHOOL_ID_MIN_LENGTH = 3;
export const SCHOOL_ID_MAX_LENGTH = 50;

export const RESERVED_SCHOOL_IDS = [
  "admin",
  "administrator",
  "platform",
  "api",
  "app",
  "www",
  "login",
  "logout",
  "dashboard",
  "support",
  "help",
  "root",
  "system"
] as const;

export const SCHOOL_ID_ERROR_MESSAGES = {
  required: "School ID is required.",
  format: "School ID can use lowercase letters, numbers, and hyphens only.",
  reserved: "This School ID is reserved. Please choose another.",
  duplicate: "This School ID is already in use."
} as const;

export function normalizeSchoolId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

export function isReservedSchoolId(value: string) {
  return RESERVED_SCHOOL_IDS.some((reserved) => reserved === value);
}

export function validateSchoolId(value: unknown) {
  const schoolId = normalizeSchoolId(value);
  if (!schoolId) return { ok: false as const, message: SCHOOL_ID_ERROR_MESSAGES.required };
  if (
    schoolId.length < SCHOOL_ID_MIN_LENGTH ||
    schoolId.length > SCHOOL_ID_MAX_LENGTH ||
    !SCHOOL_ID_PATTERN.test(schoolId)
  ) {
    return { ok: false as const, message: SCHOOL_ID_ERROR_MESSAGES.format };
  }
  if (isReservedSchoolId(schoolId)) return { ok: false as const, message: SCHOOL_ID_ERROR_MESSAGES.reserved };
  return { ok: true as const, schoolId };
}

export function normalizeTenantSlug(value: unknown) {
  const result = validateSchoolId(value);
  return result.ok ? result.schoolId : null;
}
