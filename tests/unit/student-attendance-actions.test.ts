import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import {
  loadActiveStudentsForAttendanceAction,
  submitDailyStudentAttendanceAction
} from "@/modules/academia/actions/student-attendance.actions";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const getTenantContext = vi.fn();
  const getStudentAttendanceMarkingState = vi.fn();
  const revalidatePath = vi.fn();
  const submitDailyStudentAttendance = vi.fn();
  return { getStudentAttendanceMarkingState, getTenantContext, revalidatePath, submitDailyStudentAttendance };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/tenant/context", () => ({ getTenantContext: mocks.getTenantContext }));
vi.mock("@/modules/academia/queries", () => ({
  getStudentAttendanceMarkingState: mocks.getStudentAttendanceMarkingState
}));
vi.mock("@/modules/academia/services/student-attendance.service", () => ({
  submitDailyStudentAttendance: mocks.submitDailyStudentAttendance
}));

const ctx: TenantContext = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: "00000000-0000-0000-0000-000000000003",
  accessibleBranchIds: ["00000000-0000-0000-0000-000000000003"],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000004"
};

const classSectionId = "00000000-0000-0000-0000-000000000005";
const studentId = "00000000-0000-0000-0000-000000000006";

beforeEach(() => {
  mocks.getTenantContext.mockReset();
  mocks.getTenantContext.mockResolvedValue(ctx);
  mocks.getStudentAttendanceMarkingState.mockReset();
  mocks.revalidatePath.mockReset();
  mocks.submitDailyStudentAttendance.mockReset();
});

describe("student attendance server actions", () => {
  it("loads active attendance students using server-derived tenant context", async () => {
    const data = {
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      students: [],
      existingRecordCount: 0,
      lockedCount: 0,
      isLocked: false
    };
    mocks.getStudentAttendanceMarkingState.mockResolvedValue(data);

    const result = await loadActiveStudentsForAttendanceAction({ classSectionId, attendanceDate: "2026-05-04" });

    expect(result).toEqual({ ok: true, data });
    expect(mocks.getStudentAttendanceMarkingState).toHaveBeenCalledWith(ctx, {
      classSectionId,
      attendanceDate: new Date(Date.UTC(2026, 4, 4))
    });
  });

  it("rejects client tenant fields when loading active attendance students", async () => {
    const result = await loadActiveStudentsForAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      tenantId: "00000000-0000-0000-0000-000000000099",
      actorUserId: "00000000-0000-0000-0000-000000000098"
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.getTenantContext).not.toHaveBeenCalled();
    expect(mocks.getStudentAttendanceMarkingState).not.toHaveBeenCalled();
  });

  it("submits attendance through the service using server-derived tenant context", async () => {
    const summary = {
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      totalActiveStudents: 1,
      submittedCount: 1,
      presentCount: 1,
      absentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
      onLeaveCount: 0,
      excusedCount: 0,
      updatedCount: 0,
      createdCount: 1
    };
    mocks.submitDailyStudentAttendance.mockResolvedValue(summary);

    const result = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }]
    });

    expect(result).toEqual({ ok: true, data: summary });
    expect(mocks.submitDailyStudentAttendance).toHaveBeenCalledWith(ctx, {
      classSectionId,
      attendanceDate: new Date(Date.UTC(2026, 4, 4)),
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }]
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/academia/attendance");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/academia/attendance/mark");
  });

  it("returns a safe validation error instead of calling services for invalid input", async () => {
    const result = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: []
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.submitDailyStudentAttendance).not.toHaveBeenCalled();
  });

  it("rejects client-supplied tenant and actor fields before resolving server context", async () => {
    const result = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }],
      tenantId: "00000000-0000-0000-0000-000000000099",
      branchId: "00000000-0000-0000-0000-000000000098",
      academicYearId: "00000000-0000-0000-0000-000000000097",
      actorUserId: "00000000-0000-0000-0000-000000000096"
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.getTenantContext).not.toHaveBeenCalled();
    expect(mocks.submitDailyStudentAttendance).not.toHaveBeenCalled();
  });

  it("rejects client-supplied permission hints before resolving server context", async () => {
    const result = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }],
      permission: "academia.attendance.correct",
      permissions: ["academia.attendance.mark"]
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.getTenantContext).not.toHaveBeenCalled();
    expect(mocks.submitDailyStudentAttendance).not.toHaveBeenCalled();
  });

  it("maps locked attendance and forbidden permission errors to safe action messages", async () => {
    mocks.submitDailyStudentAttendance.mockRejectedValueOnce(new AppError("STUDENT_ATTENDANCE_LOCKED"));
    const locked = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }]
    });
    expect(locked).toMatchObject({
      ok: false,
      code: "STUDENT_ATTENDANCE_LOCKED",
      error: "Attendance is locked. Please contact an administrator for correction."
    });

    mocks.submitDailyStudentAttendance.mockRejectedValueOnce(new Error("FORBIDDEN_PERMISSION:academia.attendance.mark"));
    const forbidden = await submitDailyStudentAttendanceAction({
      classSectionId,
      attendanceDate: "2026-05-04",
      sessionType: "FULL_DAY",
      entries: [{ studentId, status: "PRESENT" }]
    });
    expect(forbidden).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
      error: "You do not have permission to perform this action."
    });
    expect(JSON.stringify(forbidden)).not.toContain("academia.attendance.mark");
  });
});
