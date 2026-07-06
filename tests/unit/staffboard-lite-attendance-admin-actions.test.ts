import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { correctStaffAttendanceAction } from "@/modules/staffboard-lite/actions/staff-attendance.actions";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const correctStaffAttendance = vi.fn();
  const getTenantContext = vi.fn();
  const revalidatePath = vi.fn();
  return { correctStaffAttendance, getTenantContext, revalidatePath };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/tenant/context", () => ({ getTenantContext: mocks.getTenantContext }));
vi.mock("@/modules/staffboard-lite/services/staff-attendance.service", () => ({
  correctStaffAttendance: mocks.correctStaffAttendance
}));

const branchId = "00000000-0000-0000-0000-000000000003";
const ctx: TenantContext = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000004"
};

const serviceResult = {
  attendanceRecordId: "00000000-0000-0000-0000-000000000005",
  staffId: "00000000-0000-0000-0000-000000000006",
  branchId,
  attendanceDate: "2026-05-05",
  previousStatus: "LATE",
  newStatus: "PRESENT",
  checkInAt: "2026-05-05T03:45:00.000Z",
  checkOutAt: "2026-05-05T11:45:00.000Z",
  workingMinutes: 480,
  correctionReason: "Approved office correction",
  correctedById: ctx.userId,
  tokenHash: "server-only-token-hash",
  rawToken: "server-only-raw-token"
};

beforeEach(() => {
  mocks.getTenantContext.mockReset();
  mocks.getTenantContext.mockResolvedValue(ctx);
  mocks.correctStaffAttendance.mockReset();
  mocks.correctStaffAttendance.mockResolvedValue(serviceResult);
  mocks.revalidatePath.mockReset();
});

describe("StaffBoard Lite staff attendance admin actions", () => {
  it("calls the correction service with server-derived tenant context", async () => {
    const input = {
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction"
    };

    const result = await correctStaffAttendanceAction(input);

    expect(result).toEqual({
      ok: true,
      data: {
        attendanceRecordId: serviceResult.attendanceRecordId,
        staffId: serviceResult.staffId,
        branchId,
        attendanceDate: "2026-05-05",
        previousStatus: "LATE",
        newStatus: "PRESENT",
        checkInAt: "2026-05-05T03:45:00.000Z",
        checkOutAt: "2026-05-05T11:45:00.000Z",
        workingMinutes: 480,
        correctionReason: "Approved office correction",
        correctedById: ctx.userId
      }
    });
    expect(mocks.correctStaffAttendance).toHaveBeenCalledWith(ctx, input);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/staffboard/attendance");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/staffboard/attendance/reports");
  });

  it("rejects client-supplied tenant, branch, actor, and staff fields before service execution", async () => {
    const result = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction",
      tenantId: "00000000-0000-0000-0000-000000000099",
      branchId,
      actorUserId: "00000000-0000-0000-0000-000000000098",
      staffId: serviceResult.staffId
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.getTenantContext).not.toHaveBeenCalled();
    expect(mocks.correctStaffAttendance).not.toHaveBeenCalled();
  });

  it("rejects client-supplied permission hints before service execution", async () => {
    const result = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction",
      permission: "staffboard.attendance.correct",
      permissions: ["staffboard.attendance.view"]
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.getTenantContext).not.toHaveBeenCalled();
    expect(mocks.correctStaffAttendance).not.toHaveBeenCalled();
  });

  it("does not return raw QR token or tokenHash values", async () => {
    const result = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction"
    });

    expect(JSON.stringify(result)).not.toContain("tokenHash");
    expect(JSON.stringify(result)).not.toContain("rawToken");
    expect(JSON.stringify(result)).not.toContain(serviceResult.tokenHash);
    expect(JSON.stringify(result)).not.toContain(serviceResult.rawToken);
  });

  it("rejects blank correctionReason before service execution", async () => {
    const result = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "   "
    });

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    expect(mocks.correctStaffAttendance).not.toHaveBeenCalled();
  });

  it("rejects check-out before check-in before service execution", async () => {
    const result = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction",
      checkInAt: "2026-05-05T11:00:00.000Z",
      checkOutAt: "2026-05-05T10:00:00.000Z"
    });

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    expect(mocks.correctStaffAttendance).not.toHaveBeenCalled();
  });

  it("maps correction domain errors to safe user-facing messages", async () => {
    mocks.correctStaffAttendance.mockRejectedValueOnce(new AppError("STAFF_ATTENDANCE_RECORD_NOT_FOUND"));
    const notFound = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction"
    });
    expect(notFound).toMatchObject({
      ok: false,
      code: "STAFF_ATTENDANCE_RECORD_NOT_FOUND",
      error: "The requested attendance record was not found or is no longer accessible."
    });

    mocks.correctStaffAttendance.mockRejectedValueOnce(new Error("FORBIDDEN_PERMISSION:staffboard.attendance.correct"));
    const forbidden = await correctStaffAttendanceAction({
      attendanceRecordId: serviceResult.attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Approved office correction"
    });
    expect(forbidden).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
      error: "You do not have permission to perform this action."
    });
    expect(JSON.stringify(forbidden)).not.toContain("staffboard.attendance.correct");
  });
});
