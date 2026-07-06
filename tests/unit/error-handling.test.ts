import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  AppError,
  getSafeErrorCode,
  getUserSafeErrorMessage,
  isKnownAppError,
  mapActionError
} from "@/lib/errors";

describe("safe error handling", () => {
  it("maps known app errors to safe user messages", () => {
    const result = mapActionError(new AppError("STUDENT_ATTENDANCE_LOCKED"));

    expect(result).toEqual({
      ok: false,
      code: "STUDENT_ATTENDANCE_LOCKED",
      error: "Attendance is locked. Please contact an administrator for correction."
    });
  });

  it("maps duplicate student admission numbers to a school-friendly conflict message", () => {
    const result = mapActionError(new AppError("STUDENT_ADMISSION_NUMBER_EXISTS"));

    expect(result).toEqual({
      ok: false,
      code: "STUDENT_ADMISSION_NUMBER_EXISTS",
      error: "A student with this admission number already exists. Please use a different admission number."
    });
  });

  it("maps unknown errors to a generic message without leaking internals", () => {
    const result = mapActionError(
      new Error("Prisma failed for tenantId=00000000-0000-0000-0000-000000000001 tokenHash=secret-token-hash")
    );

    expect(result).toMatchObject({
      ok: false,
      code: "UNKNOWN_ERROR",
      error: "Something went wrong. Please try again."
    });
    expect(JSON.stringify(result)).not.toMatch(/tenantId|tokenHash|secret-token-hash|Prisma/);
  });

  it("normalizes permission errors without exposing permission payloads", () => {
    const result = mapActionError(new Error("FORBIDDEN_PERMISSION:staffboard.attendance.correct"));

    expect(result).toEqual({
      ok: false,
      code: "FORBIDDEN",
      error: "You do not have permission to perform this action."
    });
    expect(JSON.stringify(result)).not.toContain("staffboard.attendance.correct");
  });

  it("maps Zod validation errors to safe field errors", () => {
    const schema = z.object({ correctionReason: z.string().trim().min(5) }).strict();
    const parsed = schema.safeParse({ correctionReason: " ", tenantId: "tenant-secret" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const result = mapActionError(parsed.error);

    expect(result.ok).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.error).toBe("Please check the highlighted fields and try again.");
    expect(result.fieldErrors?.correctionReason?.[0]).toContain("at least 5");
    expect(result.fieldErrors?.form?.[0]).toBe("Please remove unsupported fields.");
    expect(JSON.stringify(result)).not.toContain("tenant-secret");
  });

  it("maps Prisma-like errors without leaking raw DB detail", () => {
    const error = new Error("Unique constraint failed on fields: tenantId, tokenHash") as Error & { code: string };
    error.code = "P2002";

    const result = mapActionError(error);

    expect(result).toEqual({
      ok: false,
      code: "CONFLICT",
      error: "This record already exists."
    });
    expect(JSON.stringify(result)).not.toMatch(/tenantId|tokenHash|Unique constraint/);
  });

  it("maps QR and duplicate scan errors to safe messages", () => {
    expect(getUserSafeErrorMessage("STAFF_QR_EXPIRED")).toBe("This QR code has expired. Please scan a fresh QR code.");
    expect(getUserSafeErrorMessage("INVALID_STAFF_QR")).toBe("This QR code is invalid or no longer available.");
    expect(getUserSafeErrorMessage("STAFF_ALREADY_CHECKED_IN")).toBe("You have already checked in today.");
    expect(getUserSafeErrorMessage("STAFF_ALREADY_CHECKED_OUT")).toBe("You have already checked out today.");
    expect(getUserSafeErrorMessage("STAFF_CHECK_IN_REQUIRED")).toBe("Please check in before checking out.");
  });

  it("recognizes known app-style errors and sanitizes their client code", () => {
    expect(isKnownAppError(new AppError("STAFF_QR_EXPIRED"))).toBe(true);
    expect(isKnownAppError(new Error("FORBIDDEN_PERMISSION:academia.attendance.mark"))).toBe(true);
    expect(getSafeErrorCode(new Error("FORBIDDEN_PERMISSION:academia.attendance.mark"))).toBe("FORBIDDEN");
    expect(isKnownAppError(new Error("database path C:\\secret\\query_engine-windows.dll.node"))).toBe(false);
  });

  it("maps account password errors to safe user-facing messages", () => {
    expect(mapActionError(new AppError("CURRENT_PASSWORD_INCORRECT"))).toMatchObject({
      ok: false,
      error: "Current password is incorrect."
    });
    expect(mapActionError(new AppError("USER_PASSWORD_NOT_SET"))).toMatchObject({
      ok: false,
      error: "Password is not set for this account. Ask an administrator to reset it."
    });
  });
});
