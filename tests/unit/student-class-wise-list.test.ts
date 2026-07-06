import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listStudentClassSectionOptions,
  listStudentsByClassSection,
  listStudentsWithCurrentEnrollment
} from "@/modules/academia/queries/student.queries";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const db = {
    student: { findMany: vi.fn() },
    classSection: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { findMany: vi.fn() }
  };
  const requirePermission = vi.fn();
  return { db, requirePermission };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({ requirePermission: mocks.requirePermission }));

const tenantId = "00000000-0000-0000-0000-000000000001";
const actorUserId = "00000000-0000-0000-0000-000000000002";
const branchId = "00000000-0000-0000-0000-000000000003";
const academicYearId = "00000000-0000-0000-0000-000000000004";
const classSectionId = "00000000-0000-0000-0000-000000000005";
const studentId = "00000000-0000-0000-0000-000000000006";

const ctx: TenantContext = {
  tenantId,
  userId: actorUserId,
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: academicYearId
};

const enrollmentRow = {
  id: "00000000-0000-0000-0000-000000000007",
  rollNumber: "7",
  student: {
    id: studentId,
    admissionNumber: "ADM-007",
    firstName: "Aditi",
    lastName: "Demo",
    displayName: null,
    gender: "FEMALE",
    status: "ACTIVE",
    guardianLinks: [
      {
        guardian: {
          displayName: "Riya Demo",
          firstName: "Riya",
          lastName: "Demo",
          phone: "9000000000",
          email: null
        }
      }
    ]
  },
  classSection: {
    displayName: "Class 1-A",
    academicClass: { name: "Class 1" },
    section: { name: "A" }
  }
};

beforeEach(() => {
  mocks.db.student.findMany.mockReset();
  mocks.db.classSection.findFirst.mockReset();
  mocks.db.classSection.findMany.mockReset();
  mocks.db.enrollment.findMany.mockReset();
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
});

describe("class-wise student list queries", () => {
  it("lists active enrolled students by class-section with tenant, branch, and academic-year scope", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId });
    mocks.db.enrollment.findMany.mockResolvedValue([enrollmentRow]);

    const result = await listStudentsByClassSection(ctx, classSectionId);

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.student.view",
      branchId,
      academicYearId
    });
    expect(mocks.db.classSection.findFirst).toHaveBeenCalledWith({
      where: {
        id: classSectionId,
        tenantId,
        branchId,
        academicYearId,
        status: "ACTIVE"
      },
      select: { id: true }
    });
    expect(mocks.db.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId,
        branchId,
        academicYearId,
        classSectionId,
        status: "ACTIVE",
        student: expect.objectContaining({
          tenantId,
          branchId,
          status: "ACTIVE"
        })
      })
    }));
    expect(result).toEqual([
      expect.objectContaining({
        id: studentId,
        admissionNumber: "ADM-007",
        displayName: "Aditi Demo",
        currentClassSection: "Class 1-A",
        rollNumber: "7",
        guardianContact: "Riya Demo - 9000000000"
      })
    ]);
  });

  it("includes newly registered students without current enrollment when no class-section filter is selected", async () => {
    mocks.db.student.findMany.mockResolvedValue([
      {
        ...enrollmentRow.student,
        fatherName: "Demo Father",
        guardianName: null,
        category: "General",
        enrollments: []
      }
    ]);

    const result = await listStudentsWithCurrentEnrollment(ctx, {
      search: "ADM-007",
      status: "ACTIVE"
    });

    expect(mocks.db.student.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId,
        branchId,
        status: "ACTIVE"
      })
    }));
    expect(mocks.db.enrollment.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        id: studentId,
        admissionNumber: "ADM-007",
        currentClassSection: "Not enrolled",
        rollNumber: null,
        guardianContact: "Demo Father"
      })
    ]);
  });

  it("keeps search and status filters inside the tenant-scoped enrolled-student query", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue({ id: classSectionId });
    mocks.db.enrollment.findMany.mockResolvedValue([]);

    await listStudentsWithCurrentEnrollment(ctx, {
      classSectionId,
      search: "aditi",
      status: "INACTIVE"
    });

    const where = mocks.db.enrollment.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      tenantId,
      branchId,
      academicYearId,
      classSectionId,
      status: "ACTIVE"
    });
    expect(where.student).toMatchObject({
      tenantId,
      branchId,
      status: "INACTIVE"
    });
    expect(where.student.OR).toEqual(expect.arrayContaining([
      { admissionNumber: { contains: "aditi", mode: "insensitive" } },
      { displayName: { contains: "aditi", mode: "insensitive" } }
    ]));
  });

  it("returns no students when the selected class-section is outside the current branch or academic year", async () => {
    mocks.db.classSection.findFirst.mockResolvedValue(null);

    await expect(listStudentsWithCurrentEnrollment(ctx, { classSectionId })).resolves.toEqual([]);

    expect(mocks.db.enrollment.findMany).not.toHaveBeenCalled();
    expect(mocks.db.student.findMany).not.toHaveBeenCalled();
  });

  it("lists class-section filter options through the current tenant, branch, and academic year", async () => {
    mocks.db.classSection.findMany.mockResolvedValue([
      {
        id: classSectionId,
        displayName: "Class 1-A",
        academicClass: { name: "Class 1", sortOrder: 1 },
        section: { name: "A", sortOrder: 1 }
      }
    ]);

    const result = await listStudentClassSectionOptions(ctx, { branchId });

    expect(mocks.db.classSection.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId,
        branchId,
        academicYearId,
        status: "ACTIVE"
      }
    }));
    expect(result).toEqual([{ id: classSectionId, displayName: "Class 1-A", className: "Class 1", sectionName: "A" }]);
  });
});
