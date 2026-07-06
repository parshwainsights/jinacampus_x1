import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDailyStudentAttendanceSummary
} from "@/modules/academia/queries/student-attendance-reports.queries";
import {
  autoLockStudentAttendanceForDate,
  correctStudentAttendance,
  submitDailyStudentAttendance
} from "@/modules/academia/services/student-attendance.service";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    attendanceSetting: { findFirst: vi.fn() },
    branch: { findFirst: vi.fn() },
    classSection: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { findMany: vi.fn() },
    studentAttendanceRecord: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() }
  };
  const db = {
    ...tx,
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx))
  };
  const getEffectivePermissions = vi.fn();
  const requirePermission = vi.fn();
  const writeAuditLog = vi.fn();
  return { db, getEffectivePermissions, requirePermission, tx, writeAuditLog };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({
  getEffectivePermissions: mocks.getEffectivePermissions,
  requirePermission: mocks.requirePermission
}));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));

const tenantId = "00000000-0000-0000-0000-000000000001";
const actorUserId = "00000000-0000-0000-0000-000000000002";
const branchId = "00000000-0000-0000-0000-000000000003";
const academicYearId = "00000000-0000-0000-0000-000000000004";
const classSectionId = "00000000-0000-0000-0000-000000000005";
const studentId = "00000000-0000-0000-0000-000000000006";
const enrollmentId = "00000000-0000-0000-0000-000000000007";
const attendanceRecordId = "00000000-0000-0000-0000-000000000008";
const attendanceDate = new Date(Date.UTC(2026, 4, 7));

const ctx: TenantContext = {
  tenantId,
  userId: actorUserId,
  userEmail: "teacher@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: academicYearId
};

function attendanceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: attendanceRecordId,
    tenantId,
    branchId,
    academicYearId,
    classSectionId,
    enrollmentId,
    studentId,
    attendanceDate,
    sessionType: "FULL_DAY",
    status: "ABSENT",
    remarks: null,
    markedById: actorUserId,
    markedAt: new Date("2026-05-07T03:30:00.000Z"),
    lockedAt: new Date("2026-05-07T10:00:00.000Z"),
    correctionReason: null,
    correctedById: null,
    correctedAt: null,
    createdAt: new Date("2026-05-07T03:30:00.000Z"),
    updatedAt: new Date("2026-05-07T03:30:00.000Z"),
    ...overrides
  };
}

function resetMocks() {
  mocks.tx.attendanceSetting.findFirst.mockReset();
  mocks.tx.branch.findFirst.mockReset();
  mocks.tx.classSection.findFirst.mockReset();
  mocks.tx.classSection.findMany.mockReset();
  mocks.tx.enrollment.findMany.mockReset();
  mocks.tx.studentAttendanceRecord.create.mockReset();
  mocks.tx.studentAttendanceRecord.findFirst.mockReset();
  mocks.tx.studentAttendanceRecord.findMany.mockReset();
  mocks.tx.studentAttendanceRecord.update.mockReset();
  mocks.tx.studentAttendanceRecord.updateMany.mockReset();
  mocks.db.$transaction.mockReset();
  mocks.db.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(txLike()));
  mocks.getEffectivePermissions.mockReset();
  mocks.getEffectivePermissions.mockResolvedValue(new Set(["academia.attendance.update"]));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
  mocks.writeAuditLog.mockReset();
  mocks.writeAuditLog.mockResolvedValue({ id: "audit-id" });
  mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId, timezone: "Asia/Kolkata" });
  mocks.tx.attendanceSetting.findFirst.mockResolvedValue({
    studentAutoLockEnabled: false,
    studentAutoLockTime: "15:00"
  });
}

function txLike() {
  return mocks.tx;
}

describe("Student attendance RBAC", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("does not let attendance view permission submit attendance", async () => {
    mocks.tx.classSection.findFirst.mockResolvedValue({
      id: classSectionId,
      branchId,
      academicYearId,
      classTeacherUserId: actorUserId
    });
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.attendance.mark"));

    await expect(submitDailyStudentAttendance(ctx, {
      classSectionId,
      attendanceDate: "2026-05-07",
      entries: [{ studentId, status: "PRESENT" }]
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.attendance.mark");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.mark",
      branchId,
      academicYearId
    });
    expect(mocks.tx.enrollment.findMany).not.toHaveBeenCalled();
    expect(mocks.tx.studentAttendanceRecord.create).not.toHaveBeenCalled();
  });

  it("does not let attendance mark permission correct locked attendance records", async () => {
    mocks.tx.studentAttendanceRecord.findFirst.mockResolvedValue(attendanceRecord());
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.attendance.correct"));

    await expect(correctStudentAttendance(ctx, {
      attendanceRecordId,
      status: "PRESENT",
      correctionReason: "Principal reviewed attendance register"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.attendance.correct");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.correct",
      branchId,
      academicYearId
    });
    expect(mocks.tx.studentAttendanceRecord.update).not.toHaveBeenCalled();
  });

  it("requires attendance lock permission for manual auto-lock execution", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.attendance.lock"));

    await expect(autoLockStudentAttendanceForDate(ctx, {
      attendanceDate: "2026-05-07"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.attendance.lock");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.lock",
      branchId,
      academicYearId
    });
    expect(mocks.tx.studentAttendanceRecord.updateMany).not.toHaveBeenCalled();
  });

  it("requires attendance report permission before reading report aggregates", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.attendance.report"));

    await expect(getDailyStudentAttendanceSummary(ctx, {
      attendanceDate: "2026-05-07"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.attendance.report");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.report",
      branchId,
      academicYearId
    });
    expect(mocks.tx.studentAttendanceRecord.findMany).not.toHaveBeenCalled();
  });
});
