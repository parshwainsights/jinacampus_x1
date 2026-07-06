import { beforeEach, describe, expect, it, vi } from "vitest";
import { listClassSections } from "@/modules/academia/queries/class-section.queries";
import { listGuardians } from "@/modules/academia/queries/guardian.queries";
import { listSections } from "@/modules/academia/queries/section.queries";
import { getStudentProfileWithGuardians, listStudents } from "@/modules/academia/queries/student.queries";
import { createEnrollment } from "@/modules/academia/services/enrollment.service";
import { linkGuardianToStudent } from "@/modules/academia/services/guardian.service";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    academicYear: { findFirst: vi.fn() },
    branch: { findFirst: vi.fn() },
    classSection: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    guardian: { findFirst: vi.fn(), findMany: vi.fn() },
    section: { findMany: vi.fn() },
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    studentGuardianLink: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() }
  };
  const db = {
    ...tx,
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx))
  };
  const requirePermission = vi.fn();
  const writeAuditLog = vi.fn();
  return { db, requirePermission, tx, writeAuditLog };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));

const tenantId = "00000000-0000-0000-0000-000000000001";
const actorUserId = "00000000-0000-0000-0000-000000000002";
const branchId = "00000000-0000-0000-0000-000000000003";
const academicYearId = "00000000-0000-0000-0000-000000000004";
const classSectionId = "00000000-0000-0000-0000-000000000005";
const studentId = "00000000-0000-0000-0000-000000000006";
const guardianId = "00000000-0000-0000-0000-000000000007";

const ctx: TenantContext = {
  tenantId,
  userId: actorUserId,
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: academicYearId
};

function resetMocks() {
  mocks.tx.academicYear.findFirst.mockReset();
  mocks.tx.branch.findFirst.mockReset();
  mocks.tx.classSection.findFirst.mockReset();
  mocks.tx.classSection.findMany.mockReset();
  mocks.tx.enrollment.create.mockReset();
  mocks.tx.enrollment.findFirst.mockReset();
  mocks.tx.enrollment.findMany.mockReset();
  mocks.tx.guardian.findFirst.mockReset();
  mocks.tx.guardian.findMany.mockReset();
  mocks.tx.section.findMany.mockReset();
  mocks.tx.student.findFirst.mockReset();
  mocks.tx.student.findMany.mockReset();
  mocks.tx.studentGuardianLink.create.mockReset();
  mocks.tx.studentGuardianLink.findFirst.mockReset();
  mocks.tx.studentGuardianLink.findMany.mockReset();
  mocks.db.$transaction.mockReset();
  mocks.db.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
  mocks.writeAuditLog.mockReset();
  mocks.writeAuditLog.mockResolvedValue({ id: "audit-id" });
}

describe("Academia tenant isolation", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("scopes setup and people list queries by tenant and branch context", async () => {
    mocks.tx.section.findMany.mockResolvedValue([]);
    mocks.tx.classSection.findMany.mockResolvedValue([]);
    mocks.tx.student.findMany.mockResolvedValue([]);
    mocks.tx.guardian.findMany.mockResolvedValue([]);

    await listSections(ctx, { search: "A" });
    await listClassSections(ctx, { branchId, academicYearId });
    await listStudents(ctx, { branchId, search: "Aarav" });
    await listGuardians(ctx, { search: "Meera" });

    expect(mocks.tx.section.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId })
    }));
    expect(mocks.tx.classSection.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId, branchId, academicYearId })
    }));
    expect(mocks.tx.student.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId, branchId })
    }));
    expect(mocks.tx.guardian.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId })
    }));
  });

  it("does not include cross-tenant guardian or enrollment links in student profiles", async () => {
    mocks.tx.student.findFirst.mockResolvedValue(null);

    await expect(getStudentProfileWithGuardians(ctx, studentId)).resolves.toBeNull();

    expect(mocks.tx.student.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: studentId,
        tenantId,
        branchId: { in: [branchId] }
      },
      include: expect.objectContaining({
        guardianLinks: expect.objectContaining({ where: { tenantId } }),
        enrollments: expect.objectContaining({ where: { tenantId } })
      })
    }));
    expect(mocks.requirePermission).not.toHaveBeenCalled();
  });

  it("rejects enrollment when student is not found through the current tenant scope", async () => {
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
    mocks.tx.academicYear.findFirst.mockResolvedValue({ id: academicYearId });
    mocks.tx.student.findFirst.mockResolvedValue(null);

    await expect(createEnrollment(ctx, {
      branchId,
      academicYearId,
      studentId,
      classSectionId,
      enrolledOn: "2026-04-01"
    })).rejects.toMatchObject({ code: "ACTIVE_STUDENT_NOT_FOUND" });

    expect(mocks.tx.student.findFirst).toHaveBeenCalledWith({
      where: { id: studentId, tenantId, branchId, status: "ACTIVE" },
      select: { id: true }
    });
    expect(mocks.tx.classSection.findFirst).not.toHaveBeenCalled();
    expect(mocks.tx.enrollment.create).not.toHaveBeenCalled();
  });

  it("rejects enrollment when class-section is not found through the current tenant and academic-year scope", async () => {
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
    mocks.tx.academicYear.findFirst.mockResolvedValue({ id: academicYearId });
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId });
    mocks.tx.classSection.findFirst.mockResolvedValue(null);

    await expect(createEnrollment(ctx, {
      branchId,
      academicYearId,
      studentId,
      classSectionId,
      enrolledOn: "2026-04-01"
    })).rejects.toMatchObject({ code: "CLASS_SECTION_NOT_FOUND" });

    expect(mocks.tx.classSection.findFirst).toHaveBeenCalledWith({
      where: {
        id: classSectionId,
        tenantId,
        branchId,
        academicYearId,
        status: "ACTIVE"
      },
      select: { id: true, branchId: true, academicYearId: true }
    });
    expect(mocks.tx.enrollment.create).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant guardian links without revealing whether the other tenant record exists", async () => {
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId, branchId });
    mocks.tx.guardian.findFirst.mockResolvedValue(null);

    await expect(linkGuardianToStudent(ctx, {
      studentId,
      guardianId,
      relation: "FATHER"
    })).rejects.toMatchObject({ code: "GUARDIAN_NOT_FOUND" });

    expect(mocks.tx.student.findFirst).toHaveBeenCalledWith({
      where: { id: studentId, tenantId },
      select: { id: true, branchId: true }
    });
    expect(mocks.tx.guardian.findFirst).toHaveBeenCalledWith({
      where: { id: guardianId, tenantId },
      select: { id: true }
    });
    expect(mocks.tx.studentGuardianLink.create).not.toHaveBeenCalled();
  });
});
