import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TenantContext } from "@/lib/tenant/context";
import {
  getDailyStaffAttendanceReport,
  getHalfDayStaffAttendanceReport,
  getLateArrivalReport,
  getManualStaffCorrectionReport,
  getMonthlyStaffAttendanceSummary,
  getNonTeachingStaffAttendanceReport,
  getStaffAttendanceReportsPageData,
  getTeacherAttendanceReport
} from "@/modules/staffboard-lite/queries/staff-attendance-reports.queries";

const mocks = vi.hoisted(() => {
  const db = {
    branch: { findMany: vi.fn() },
    staffAttendanceRecord: { findMany: vi.fn() }
  };
  const requirePermission = vi.fn();
  return { db, requirePermission };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({ requirePermission: mocks.requirePermission }));

const tenantId = "00000000-0000-0000-0000-000000000001";
const branchId = "00000000-0000-0000-0000-000000000003";
const otherBranchId = "00000000-0000-0000-0000-000000000099";
const ctx: TenantContext = {
  tenantId,
  userId: "00000000-0000-0000-0000-000000000002",
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000004"
};

function staff(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-0000-0000-000000000101",
    employeeCode: "EMP-1001",
    firstName: "Meera",
    middleName: null,
    lastName: "Sharma",
    staffType: "TEACHER",
    department: "Academics",
    ...overrides
  };
}

function attendanceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-0000-0000-000000000201",
    attendanceDate: new Date(Date.UTC(2026, 4, 5)),
    status: "PRESENT",
    checkInAt: new Date("2026-05-05T03:45:00.000Z"),
    checkOutAt: new Date("2026-05-05T11:45:00.000Z"),
    workingMinutes: 480,
    checkInSource: "QR_SCAN",
    checkOutSource: "QR_SCAN",
    correctionReason: null,
    updatedAt: new Date("2026-05-05T12:00:00.000Z"),
    staff: staff(),
    updatedBy: null,
    ...overrides
  };
}

beforeEach(() => {
  mocks.db.branch.findMany.mockReset();
  mocks.db.branch.findMany.mockResolvedValue([{ id: branchId, name: "Main Branch", code: "MAIN" }]);
  mocks.db.staffAttendanceRecord.findMany.mockReset();
  mocks.db.staffAttendanceRecord.findMany.mockResolvedValue([]);
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
});

describe("StaffBoard Lite attendance report queries", () => {
  it("daily report is tenant and branch scoped", async () => {
    mocks.db.staffAttendanceRecord.findMany.mockResolvedValue([attendanceRecord()]);

    const result = await getDailyStaffAttendanceReport(ctx, { date: "2026-05-05" });

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "staffboard.attendance.report",
      branchId
    });
    expect(mocks.db.staffAttendanceRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId,
        branchId,
        attendanceDate: new Date(Date.UTC(2026, 4, 5))
      })
    }));
    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where.staff).toMatchObject({
      tenantId,
      branchId
    });
    expect(result.rows[0]).toMatchObject({
      employeeCode: "EMP-1001",
      staffName: "Meera Sharma",
      status: "PRESENT",
      source: "QR_SCAN"
    });
  });

  it("rejects inaccessible requested branches before reading report records", async () => {
    await expect(getDailyStaffAttendanceReport(ctx, {
      branchId: otherBranchId,
      date: "2026-05-05"
    })).rejects.toMatchObject({ code: "FORBIDDEN_STAFF_ATTENDANCE_REPORT_BRANCH" });

    expect(mocks.db.staffAttendanceRecord.findMany).not.toHaveBeenCalled();
  });

  it("teacher report includes only TEACHER staff", async () => {
    await getTeacherAttendanceReport(ctx, { fromDate: "2026-05-01", toDate: "2026-05-31" });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where.staff).toMatchObject({
      staffType: "TEACHER"
    });
  });

  it("non-teaching report excludes TEACHER staff", async () => {
    await getNonTeachingStaffAttendanceReport(ctx, { fromDate: "2026-05-01", toDate: "2026-05-31" });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where.staff).toMatchObject({
      NOT: { staffType: "TEACHER" }
    });
  });

  it("late arrival report includes only LATE records", async () => {
    await getLateArrivalReport(ctx, { fromDate: "2026-05-01", toDate: "2026-05-31", staffType: "DRIVER" });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where).toMatchObject({
      status: "LATE"
    });
    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where.staff).toMatchObject({
      staffType: "DRIVER"
    });
  });

  it("half-day report includes only HALF_DAY records", async () => {
    await getHalfDayStaffAttendanceReport(ctx, { fromDate: "2026-05-01", toDate: "2026-05-31" });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where).toMatchObject({
      status: "HALF_DAY"
    });
  });

  it("monthly summary counts statuses from existing records only", async () => {
    const staffRecord = staff({ id: "00000000-0000-0000-0000-000000000111", staffType: "ADMIN" });
    mocks.db.staffAttendanceRecord.findMany.mockResolvedValue([
      { id: "1", status: "PRESENT", workingMinutes: 480, staff: staffRecord },
      { id: "2", status: "LATE", workingMinutes: 430, staff: staffRecord },
      { id: "3", status: "HALF_DAY", workingMinutes: 210, staff: staffRecord },
      { id: "4", status: "ABSENT", workingMinutes: null, staff: staffRecord },
      { id: "5", status: "ON_LEAVE", workingMinutes: null, staff: staffRecord },
      { id: "6", status: "WEEK_OFF", workingMinutes: null, staff: staffRecord },
      { id: "7", status: "HOLIDAY", workingMinutes: null, staff: staffRecord }
    ]);

    const result = await getMonthlyStaffAttendanceSummary(ctx, { month: 5, year: 2026 });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where).toMatchObject({
      tenantId,
      branchId,
      attendanceDate: {
        gte: new Date(Date.UTC(2026, 4, 1)),
        lte: new Date(Date.UTC(2026, 4, 31))
      }
    });
    expect(result.rows).toEqual([expect.objectContaining({
      presentDays: 1,
      lateDays: 1,
      halfDayDays: 1,
      absentDays: 1,
      onLeaveDays: 1,
      holidayWeekOffDays: 2,
      markedDays: 7,
      totalWorkingMinutes: 1120
    })]);
  });

  it("manual correction report includes only records with correctionReason", async () => {
    mocks.db.staffAttendanceRecord.findMany.mockResolvedValue([
      attendanceRecord({
        status: "PRESENT",
        correctionReason: "Forgot check-out; verified by office",
        updatedBy: {
          displayName: null,
          firstName: "Anita",
          lastName: "Rao",
          email: "anita@example.com"
        }
      })
    ]);

    const result = await getManualStaffCorrectionReport(ctx, { fromDate: "2026-05-01", toDate: "2026-05-31" });

    expect(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].where).toMatchObject({
      correctionReason: { not: null }
    });
    expect(result.rows[0]).toMatchObject({
      correctionReason: "Forgot check-out; verified by office",
      updatedByName: "Anita Rao"
    });
  });

  it("requires report permission before reading report records", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:staffboard.attendance.report"));

    const result = await getDailyStaffAttendanceReport(ctx, { date: "2026-05-05" });

    expect(result).toEqual({ branchOptions: [], selectedBranchId: null, rows: [] });
    expect(mocks.db.staffAttendanceRecord.findMany).not.toHaveBeenCalled();
  });

  it("does not select raw QR token or tokenHash fields", async () => {
    await getDailyStaffAttendanceReport(ctx, { date: "2026-05-05" });

    const selectJson = JSON.stringify(mocks.db.staffAttendanceRecord.findMany.mock.calls[0][0].select);
    expect(selectJson).not.toMatch(/tokenHash|rawToken|token/i);
  });

  it("splits combined page filters before calling strict report schemas", async () => {
    const result = await getStaffAttendanceReportsPageData(ctx, {
      branchId,
      date: "2026-05-05",
      fromDate: "2026-05-01",
      toDate: "2026-05-31",
      month: "5",
      year: "2026",
      staffType: "TEACHER",
      status: "PRESENT",
      department: "Academics",
      search: "Meera",
      page: "1",
      pageSize: "10"
    });

    expect(result).toMatchObject({
      selectedBranchId: branchId,
      dailyRows: [],
      teacherRows: [],
      nonTeachingRows: [],
      lateRows: [],
      halfDayRows: [],
      monthlyRows: [],
      correctionRows: []
    });
    expect(mocks.db.staffAttendanceRecord.findMany).toHaveBeenCalled();
  });
});
