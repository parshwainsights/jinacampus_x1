import { beforeEach, describe, expect, it, vi } from "vitest";
import { listActiveEnrolledStudentsForAttendance } from "@/modules/academia/queries/student-attendance.queries";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const db = {
    classSection: { findFirst: vi.fn() },
    enrollment: { findMany: vi.fn() },
    studentAttendanceRecord: { findMany: vi.fn() }
  };
  const getEffectivePermissions = vi.fn();
  const requirePermission = vi.fn();
  return { db, getEffectivePermissions, requirePermission };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({
  getEffectivePermissions: mocks.getEffectivePermissions,
  requirePermission: mocks.requirePermission
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

const branchId = "00000000-0000-0000-0000-000000000003";
const academicYearId = "00000000-0000-0000-0000-000000000004";
const classSectionId = "00000000-0000-0000-0000-000000000005";
const enrollmentId = "00000000-0000-0000-0000-000000000006";
const studentId = "00000000-0000-0000-0000-000000000007";

beforeEach(() => {
  mocks.db.classSection.findFirst.mockReset();
  mocks.db.enrollment.findMany.mockReset();
  mocks.db.studentAttendanceRecord.findMany.mockReset();
  mocks.getEffectivePermissions.mockReset();
  mocks.getEffectivePermissions.mockResolvedValue(new Set(["academia.attendance.view"]));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
});

describe("listActiveEnrolledStudentsForAttendance", () => {
  it("returns active enrolled students for the attendance screen", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([
      {
        id: enrollmentId,
        studentId,
        classSectionId,
        rollNumber: "12",
        student: {
          admissionNumber: "ADM-1001",
          firstName: "Aarav",
          middleName: null,
          lastName: "Shah",
          displayName: null,
          gender: "MALE",
          status: "ACTIVE"
        }
      }
    ]);

    const result = await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(result).toEqual([
      {
        enrollmentId,
        studentId,
        admissionNo: "ADM-1001",
        rollNumber: "12",
        firstName: "Aarav",
        middleName: null,
        lastName: "Shah",
        displayName: "Aarav Shah",
        gender: "MALE",
        status: "ACTIVE",
        classSectionId
      }
    ]);
  });

  it("scopes class-section lookup by tenant, branch, and academic year", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue(null);

    await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(mocks.db.classSection.findFirst).toHaveBeenCalledWith({
      where: {
        id: classSectionId,
        tenantId: ctx.tenantId,
        branchId,
        academicYearId,
        status: "ACTIVE"
      },
      select: { id: true, branchId: true, academicYearId: true }
    });
  });

  it("requires attendance view permission for the resolved class-section scope", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.view",
      branchId,
      academicYearId
    });
  });

  it("returns only ACTIVE enrollments with ACTIVE students", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(mocks.db.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: ctx.tenantId,
        branchId,
        academicYearId,
        classSectionId,
        status: "ACTIVE",
        student: {
          tenantId: ctx.tenantId,
          branchId,
          status: "ACTIVE"
        }
      })
    }));
  });

  it("applies selected-date enrollment bounds for mid-year admissions", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrolledStudentsForAttendance(ctx, {
      classSectionId,
      attendanceDate: "2026-08-15"
    });

    const call = mocks.db.enrollment.findMany.mock.calls[0][0];
    expect(call.where.enrolledOn.lte).toEqual(new Date(Date.UTC(2026, 7, 15)));
    expect(call.where.OR).toEqual([
      { leftOn: null },
      { leftOn: { gte: new Date(Date.UTC(2026, 7, 15)) } }
    ]);
  });

  it("sorts by roll number, student name, and admission number", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(mocks.db.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { rollNumber: "asc" },
        { student: { displayName: "asc" } },
        { student: { firstName: "asc" } },
        { student: { admissionNumber: "asc" } }
      ]
    }));
  });

  it("does not call unscoped enrollment queries", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrolledStudentsForAttendance(ctx, classSectionId);

    const where = mocks.db.enrollment.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe(ctx.tenantId);
    expect(where.branchId).toBe(branchId);
    expect(where.academicYearId).toBe(academicYearId);
    expect(where.classSectionId).toBe(classSectionId);
  });

  it("returns an empty result for missing or inaccessible class sections", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue(null);

    const result = await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId });

    expect(result).toEqual([]);
    expect(mocks.requirePermission).not.toHaveBeenCalled();
    expect(mocks.db.enrollment.findMany).not.toHaveBeenCalled();
  });
});
