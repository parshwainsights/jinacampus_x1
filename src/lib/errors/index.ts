import { z } from "zod";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message = code,
    public readonly status = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function forbidden(code = "FORBIDDEN") {
  return new AppError(code, code, 403);
}

export function notFound(code = "NOT_FOUND") {
  return new AppError(code, code, 404);
}

export const DEFAULT_UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const DEFAULT_VALIDATION_ERROR_MESSAGE = "Please check the highlighted fields and try again.";

export type SafeActionError = {
  ok: false;
  code: string;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

type MapActionErrorOptions = {
  fallbackMessage?: string;
  validationMessage?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function rawErrorCode(error: unknown): string | null {
  if (error instanceof AppError) return error.code;
  if (error instanceof z.ZodError) return "VALIDATION_ERROR";

  if (isRecord(error) && typeof error.code === "string" && error.code.trim()) {
    return error.code.trim();
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (/^[A-Z][A-Z0-9_]*(?::[a-z0-9_.-]+)?$/.test(message)) return message;
  }

  return null;
}

export function normalizeErrorCode(code: string | null | undefined) {
  const rawCode = code?.trim();
  if (!rawCode) return "UNKNOWN_ERROR";

  if (rawCode.startsWith("FORBIDDEN_PERMISSION")) return "FORBIDDEN";
  if (rawCode === "FORBIDDEN_BRANCH_ACCESS") return "BRANCH_ACCESS_DENIED";
  if (rawCode === "P2002") return "CONFLICT";
  if (rawCode === "P2025") return "NOT_FOUND";

  return rawCode;
}

export function getSafeErrorCode(error: unknown) {
  return normalizeErrorCode(rawErrorCode(error));
}

export function isKnownAppError(error: unknown) {
  return rawErrorCode(error) !== null;
}

export function getUserSafeErrorMessage(errorOrCode: unknown, fallback = DEFAULT_UNEXPECTED_ERROR_MESSAGE) {
  const code = typeof errorOrCode === "string" ? errorOrCode : rawErrorCode(errorOrCode);
  const normalizedCode = normalizeErrorCode(code);
  const codePrefix = code?.split(":")[0] ?? normalizedCode;

  switch (normalizedCode) {
    case "UNAUTHENTICATED":
      return "Please sign in to continue.";
    case "TENANT_INACTIVE":
      return "This school account is not active. Please contact support.";
    case "USER_INACTIVE":
      return "Your account is not active. Please contact an administrator.";
    case "PASSWORD_CHANGE_REQUIRED":
      return "Change your temporary password before continuing.";
    case "SCHOOL_LOGIN_REQUIRED":
      return "Use the correct sign-in portal for this account.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "BRANCH_ACCESS_DENIED":
      return "You do not have access to this branch.";
    case "NOT_FOUND":
      return "The requested record was not found or is no longer accessible.";
    case "VALIDATION_ERROR":
      return DEFAULT_VALIDATION_ERROR_MESSAGE;
    case "CONFLICT":
      return "This record already exists.";
    case "STUDENT_ADMISSION_NUMBER_EXISTS":
      return "A student with this admission number already exists. Please use a different admission number.";
    case "STUDENT_DOCUMENT_STORAGE_UNAVAILABLE":
    case "STUDENT_DOCUMENT_BUCKET_MUST_BE_PRIVATE":
      return "Student document storage is not available. Ask an administrator to check the secure storage configuration.";
    case "STUDENT_DOCUMENT_FILE_REQUIRED":
      return "Choose a student document to upload.";
    case "STUDENT_DOCUMENT_TOO_LARGE":
      return "This file exceeds the configured student document size limit.";
    case "STUDENT_DOCUMENT_TYPE_NOT_ALLOWED":
    case "STUDENT_PHOTO_MUST_BE_IMAGE":
      return "Use a valid PDF, JPEG, PNG, or WebP file. Passport photographs must be images.";
    case "STUDENT_DOCUMENT_UPLOAD_FAILED":
      return "The document could not be stored securely. Please try again.";
    case "STUDENT_DOCUMENT_DOWNLOAD_FAILED":
      return "The document could not be opened. Please try again.";
    case "STUDENT_DOCUMENT_DELETE_FAILED":
      return "The document could not be deleted. Please try again.";
    case "INSTITUTION_LOGO_STORAGE_UNAVAILABLE":
    case "INSTITUTION_LOGO_BUCKET_MUST_BE_PUBLIC":
      return "Institution logo storage is not available. Check the public branding storage configuration.";
    case "INSTITUTION_LOGO_FILE_REQUIRED":
      return "Choose an institution logo to upload.";
    case "INSTITUTION_LOGO_TOO_LARGE":
      return "The institution logo exceeds the configured 2 MB size limit.";
    case "INSTITUTION_LOGO_TYPE_NOT_ALLOWED":
      return "Use a valid JPEG, PNG, or WebP institution logo.";
    case "INSTITUTION_LOGO_UPLOAD_FAILED":
      return "The institution logo could not be uploaded. Please try again.";
    case "WHATSAPP_NUMBER_REQUIRED":
      return "Add a valid WhatsApp number before enabling attendance communication.";
    case "STUDENT_IMPORT_FILE_REQUIRED":
      return "Choose an Excel or CSV student file.";
    case "STUDENT_IMPORT_FILE_SIZE_INVALID":
      return "The student file is empty or exceeds the 4 MB upload limit.";
    case "STUDENT_IMPORT_FILE_TYPE_INVALID":
    case "STUDENT_IMPORT_FILE_INVALID":
      return "Use a valid .xlsx or .csv student file.";
    case "STUDENT_IMPORT_SHEET_MISSING":
      return "The spreadsheet does not contain a Students sheet.";
    case "STUDENT_ATTENDANCE_LOCKED":
    case "STUDENT_ATTENDANCE_CUTOFF_PASSED":
      return "Attendance is locked. Please contact an administrator for correction.";
    case "STUDENT_ATTENDANCE_ALREADY_EXISTS":
    case "STUDENT_ATTENDANCE_ALREADY_MARKED_FOR_DIFFERENT_SCOPE":
      return "Attendance has already been recorded for this student and date.";
    case "NO_ACTIVE_ENROLLMENTS":
      return "No active enrolled students were found for the selected class-section and date.";
    case "STUDENT_NOT_ACTIVE_ENROLLED":
      return "One or more selected students are not actively enrolled for this class-section.";
    case "STAFF_QR_EXPIRED":
      return "This QR code has expired. Please scan a fresh QR code.";
    case "INVALID_STAFF_QR":
      return "This QR code is invalid or no longer available.";
    case "STAFF_QR_BRANCH_MISMATCH":
      return "This QR code belongs to a different branch.";
    case "STAFF_ALREADY_CHECKED_IN":
      return "You have already checked in today.";
    case "STAFF_ALREADY_CHECKED_OUT":
      return "You have already checked out today.";
    case "STAFF_CHECK_IN_REQUIRED":
      return "Please check in before checking out.";
    case "ACTIVE_STAFF_PROFILE_NOT_FOUND":
      return "An active staff profile was not found for your account.";
    case "STAFF_PROFILE_INACTIVE":
      return "Reactivate the staff profile before enabling login access.";
    case "STAFF_LOGIN_ACCESS_ALREADY_DISABLED":
      return "Login access is already disabled for this staff member.";
    case "STAFF_LOGIN_BRANCH_ACCESS_REQUIRED":
      return "Assign this staff member to their branch before reactivating login access.";
    case "STAFF_LOGIN_ROLE_REQUIRED":
      return "Assign an approved school role before reactivating login access.";
    case "STAFF_PROFILE_CREATION_REQUIRED":
      return "Create Teachers, Office Staff, and Staff from Staff Profiles so their employee and login records stay linked.";
    case "STAFF_PROFILE_REQUIRED_FOR_ROLE":
      return "Link this user to a staff profile before assigning this role.";
    case "STAFF_BRANCH_INACTIVE":
      return "Your assigned branch is not active for staff attendance.";
    case "STAFF_QR_ATTENDANCE_DISABLED":
      return "Staff QR attendance is disabled for this branch.";
    case "STAFF_QR_BRANCH_REQUIRED":
      return "Select a branch before generating a QR code.";
    case "INVALID_STAFF_QR_TOKEN_VALIDITY_SECONDS":
      return "Choose a QR validity window between 30 and 900 seconds.";
    case "STAFF_ATTENDANCE_RECORD_NOT_FOUND":
      return "The requested attendance record was not found or is no longer accessible.";
    case "STAFF_ATTENDANCE_CHECK_OUT_BEFORE_CHECK_IN":
      return "Check-out time must be after check-in time.";
    case "STAFF_ATTENDANCE_MANAGED_BY_LEAVE":
      return "This attendance record is managed by an approved leave application. Cancel or revise the leave first.";
    case "STAFF_ON_APPROVED_LEAVE":
      return "You have approved leave for today. Contact an authorised approver if the leave needs to be cancelled.";
    case "STAFF_LEAVE_TYPE_NOT_FOUND":
      return "Select an active leave type configured for your branch.";
    case "STAFF_LEAVE_APPLICATION_NOT_FOUND":
      return "The leave application was not found or is no longer accessible.";
    case "STAFF_LEAVE_BACKDATED_NOT_ALLOWED":
      return "Backdated leave applications are not allowed for this branch.";
    case "STAFF_LEAVE_NOTICE_REQUIRED":
      return "This leave application does not meet the branch notice period.";
    case "STAFF_LEAVE_MAXIMUM_DAYS_EXCEEDED":
      return "This leave exceeds the maximum consecutive duration configured for the branch.";
    case "STAFF_LEAVE_HALF_DAY_NOT_ALLOWED":
      return "Half-day leave is not allowed for this leave type or branch.";
    case "STAFF_LEAVE_NO_WORKING_DAYS":
      return "The selected range contains no configured working days.";
    case "STAFF_LEAVE_OVERLAP":
      return "An active leave application already overlaps this date range.";
    case "STAFF_LEAVE_NOT_EDITABLE":
      return "Only pending applications or clarification requests can be edited.";
    case "STAFF_LEAVE_ALREADY_ACTIONED":
      return "This leave application has already been actioned.";
    case "STAFF_LEAVE_NOT_WITHDRAWABLE":
      return "Only pending applications or clarification requests can be withdrawn.";
    case "STAFF_LEAVE_NOT_CANCELLABLE":
      return "Only approved leave can be cancelled by an authorised approver.";
    case "STAFF_LEAVE_PAST_CANCELLATION_BLOCKED":
      return "Leave that has already started cannot be cancelled from this workflow.";
    case "STAFF_LEAVE_APPROVER_REQUIRED":
      return "You are not a designated leave approver for this branch.";
    case "STAFF_LEAVE_DESIGNATED_APPROVER_REQUIRED":
      return "Add at least one active designated approver before using designated-approver mode.";
    case "STAFF_LEAVE_APPROVER_USER_NOT_FOUND":
      return "Select an active Principal or Office Staff user assigned to this branch.";
    case "STAFF_LEAVE_BALANCE_INSUFFICIENT":
      return "The staff member does not have enough leave balance for this application.";
    case "STAFF_LEAVE_BALANCE_CONFLICT":
    case "STAFF_LEAVE_BALANCE_BELOW_USED":
      return "This balance change conflicts with leave that has already been used.";
    case "STAFF_LEAVE_ATTENDANCE_CONFLICT":
      return "Attendance already exists for one or more selected dates. Resolve it before approving or cancelling leave.";
    case "STAFF_LEAVE_DOCUMENT_REQUIRED":
      return "Upload the required supporting document before approving this leave.";
    case "STAFF_LEAVE_DOCUMENT_NOT_EDITABLE":
      return "Supporting documents can be changed only while leave is pending or awaiting clarification.";
    case "STAFF_LEAVE_DOCUMENT_STORAGE_UNAVAILABLE":
    case "STAFF_LEAVE_DOCUMENT_BUCKET_MUST_BE_PRIVATE":
      return "Leave document storage is not available. Ask an administrator to check the private storage configuration.";
    case "STAFF_LEAVE_DOCUMENT_FILE_REQUIRED":
      return "Choose a supporting document to upload.";
    case "STAFF_LEAVE_DOCUMENT_TOO_LARGE":
      return "This supporting document exceeds the configured size limit.";
    case "STAFF_LEAVE_DOCUMENT_TYPE_NOT_ALLOWED":
      return "Use a valid PDF, JPEG, PNG, or WebP supporting document.";
    case "STAFF_LEAVE_DOCUMENT_UPLOAD_FAILED":
      return "The supporting document could not be stored securely. Please try again.";
    case "STAFF_LEAVE_DOCUMENT_DOWNLOAD_FAILED":
      return "The supporting document could not be opened. Please try again.";
    case "STAFF_LEAVE_DOCUMENT_DELETE_FAILED":
      return "The supporting document could not be deleted. Please try again.";
    case "CURRENT_PASSWORD_INCORRECT":
      return "Current password is incorrect.";
    case "USER_PASSWORD_NOT_SET":
      return "Password is not set for this account. Ask an administrator to reset it.";
    case "USER_ROLE_ALREADY_ASSIGNED":
      return "This role is already assigned to the user.";
    case "ROLE_ASSIGNMENT_NOT_ALLOWED":
      return "You cannot assign this role.";
    case "USER_ROLE_ASSIGNMENT_NOT_FOUND":
      return "This role assignment was not found or is no longer active.";
    case "USER_BRANCH_ALREADY_ASSIGNED":
      return "This branch is already assigned to the user.";
    case "USER_BRANCH_ACCESS_NOT_FOUND":
      return "This branch access was not found or is no longer active.";
    case "USER_BRANCH_ACCESS_REQUIRED":
      return "A user must keep at least one active branch access.";
    case "USER_SELF_DEACTIVATE_BLOCKED":
      return "You cannot deactivate your own account.";
    case "USER_ALREADY_DEACTIVATED":
      return "This user account is already deactivated.";
    case "USER_PLATFORM_ADMIN_DEACTIVATE_FORBIDDEN":
      return "You cannot deactivate a platform administrator account.";
    case "ADMINISTRATOR_ACCESS_REQUIRED":
      return "Administrator access is required for this action.";
    case "INVALID_SCHOOL_ID":
      return "Enter a valid School ID using lowercase letters, numbers, and single hyphens.";
    case "SCHOOL_ID_ALREADY_EXISTS":
      return "This School ID is already in use.";
    case "SCHOOL_ID_RESERVED":
      return "This School ID is reserved. Please choose another.";
    case "CURRENT_SCHOOL_ID_MISMATCH":
      return "Current School ID does not match this school.";
    case "SCHOOL_SELF_DEACTIVATE_BLOCKED":
      return "You cannot deactivate the school that owns your current administrator session.";
    case "SCHOOL_SELF_DELETE_BLOCKED":
      return "You cannot delete the school that owns your current administrator session.";
    case "SCHOOL_DELETE_BLOCKED":
    case "SCHOOL_DELETE_BLOCKED_BY_DEPENDENCIES":
      return "This school has dependent data. Deactivate it instead.";
    default:
      break;
  }

  if (codePrefix === "FORBIDDEN_PERMISSION" || codePrefix.startsWith("FORBIDDEN")) {
    return "You do not have permission to perform this action.";
  }
  if (normalizedCode.endsWith("_NOT_FOUND")) {
    return "The requested record was not found or is no longer accessible.";
  }
  if (normalizedCode.endsWith("_ALREADY_EXISTS") || normalizedCode.includes("_DUPLICATE")) {
    return "This record already exists.";
  }
  if (normalizedCode.startsWith("INVALID_")) {
    return DEFAULT_VALIDATION_ERROR_MESSAGE;
  }

  return fallback;
}

function safeZodIssueMessage(issue: z.ZodIssue) {
  if (issue.code === z.ZodIssueCode.unrecognized_keys) return "Please remove unsupported fields.";
  return issue.message || "Please check this field.";
}

export function getZodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), safeZodIssueMessage(issue)];
  }

  return fieldErrors;
}

export function mapActionError(error: unknown, options: MapActionErrorOptions = {}): SafeActionError {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: options.validationMessage ?? DEFAULT_VALIDATION_ERROR_MESSAGE,
      fieldErrors: getZodFieldErrors(error)
    };
  }

  const code = getSafeErrorCode(error);
  return {
    ok: false,
    code,
    error: getUserSafeErrorMessage(error, options.fallbackMessage ?? DEFAULT_UNEXPECTED_ERROR_MESSAGE)
  };
}
