import { beforeEach, describe, expect, it, vi } from "vitest";
import { listClassSections } from "@/modules/academia/queries/class-section.queries";
import { listClasses } from "@/modules/academia/queries/class.queries";
import {
  listActiveEnrollmentsByClassSection,
  listEnrollments
} from "@/modules/academia/queries/enrollment.queries";
import { listGuardians } from "@/modules/academia/queries/guardian.queries";
import { listSections } from "@/modules/academia/queries/section.queries";
import { listStudents } from "@/modules/academia/queries/student.queries";
import { listActiveEnrolledStudentsForAttendance } from "@/modules/academia/queries/student-attendance.queries";
import { listSubjects } from "@/modules/academia/queries/subject.queries";
import { createClass } from "@/modules/academia/services/class.service";
import { createEnrollment } from "@/modules/academia/services/enrollment.service";
import { linkGuardianToStudent } from "@/modules/academia/services/guardian.service";
import { createStudent, updateStudent } from "@/modules/academia/services/student.service";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    academicYear: { findFirst: vi.fn() },
    branch: { findFirst: vi.fn() },
    class: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    classSection: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    guardian: { findFirst: vi.fn(), findMany: vi.fn() },
    section: { findMany: vi.fn() },
    student: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    studentAttendanceRecord: { findMany: vi.fn() },
    studentGuardianLink: { create: vi.fn(), findFirst: vi.fn() },
    subject: { findMany: vi.fn() }
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
const studentId = "00000000-0000-0000-0000-000000000005";
const guardianId = "00000000-0000-0000-0000-000000000006";
const classSectionId = "00000000-0000-0000-0000-000000000007";

function validStudentInput() {
  return {
    branchId,
    admissionNumber: "ADM-1001",
    admissionDate: "2026-04-01",
    fullName: "Aarav Shah",
    dateOfBirth: "2018-01-10",
    fatherName: "Nilesh Shah",
    motherName: "Kavita Shah",
    aadhaarNumber: "1234 1234 1234",
    religion: "Hindu",
    caste: "General",
    category: "General",
    nationality: "India",
    city: "Ahmedabad",
    state: "Gujarat"
  };
}

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
  for (const model of Object.values(mocks.tx)) {
    for (const method of Object.values(model)) {
      method.mockReset();
    }
  }
  mocks.db.$transaction.mockReset();
  mocks.db.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
  mocks.getEffectivePermissions.mockReset();
  mocks.getEffectivePermissions.mockResolvedValue(new Set(["academia.attendance.view"]));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
  mocks.writeAuditLog.mockReset();
  mocks.writeAuditLog.mockResolvedValue({ id: "audit-id" });
}

describe("Academia RBAC", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("requires academia.class.manage before listing or creating classes", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.class.manage"));

    await expect(listClasses(ctx)).rejects.toThrow("FORBIDDEN_PERMISSION:academia.class.manage");
    await expect(createClass(ctx, { code: "C1", name: "Class I" })).rejects.toThrow(
      "FORBIDDEN_PERMISSION:academia.class.manage"
    );

    expect(mocks.tx.class.findMany).not.toHaveBeenCalled();
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.class.create).not.toHaveBeenCalled();
  });

  it("requires class manage before listing class sections", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.class.manage"));

    await expect(listClassSections(ctx, { branchId, academicYearId })).rejects.toThrow(
      "FORBIDDEN_PERMISSION:academia.class.manage"
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.class.manage",
      branchId,
      academicYearId
    });
    expect(mocks.tx.classSection.findMany).not.toHaveBeenCalled();
  });

  it("does not let class manage permission read sections or subjects", async () => {
    mocks.requirePermission.mockImplementation(({ permission }: { permission: string }) => (
      Promise.reject(new Error(`FORBIDDEN_PERMISSION:${permission}`))
    ));

    await expect(listSections(ctx)).rejects.toThrow("FORBIDDEN_PERMISSION:academia.section.manage");
    await expect(listSubjects(ctx)).rejects.toThrow("FORBIDDEN_PERMISSION:academia.subject.manage");

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "academia.section.manage" });
    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "academia.subject.manage" });
    expect(mocks.tx.section.findMany).not.toHaveBeenCalled();
    expect(mocks.tx.subject.findMany).not.toHaveBeenCalled();
  });

  it("requires student view permission before listing students", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.student.view"));

    await expect(listStudents(ctx, { branchId })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.student.view");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.student.view",
      branchId
    });
    expect(mocks.tx.student.findMany).not.toHaveBeenCalled();
  });

  it("does not let student view permission create students", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.student.create"));

    await expect(createStudent(ctx, {
      ...validStudentInput()
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.student.create");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.student.create",
      branchId
    });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.student.create).not.toHaveBeenCalled();
  });

  it("requires student update permission before mutating an existing student", async () => {
    mocks.tx.student.findFirst.mockResolvedValue({
      id: studentId,
      tenantId,
      branchId,
      admissionNumber: "ADM-1001",
      firstName: "Aarav",
      middleName: null,
      lastName: "Shah",
      displayName: "Aarav Shah",
      status: "ACTIVE"
    });
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.student.update"));

    await expect(updateStudent(ctx, {
      studentId,
      firstName: "Aarav"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.student.update");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.student.update",
      branchId
    });
    expect(mocks.tx.student.update).not.toHaveBeenCalled();
  });

  it("requires guardian manage permission before listing guardians", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.guardian.manage"));

    await expect(listGuardians(ctx)).rejects.toThrow("FORBIDDEN_PERMISSION:academia.guardian.manage");

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "academia.guardian.manage" });
    expect(mocks.tx.guardian.findMany).not.toHaveBeenCalled();
  });

  it("requires guardian manage permission before linking guardians to students", async () => {
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId, branchId });
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.guardian.manage"));

    await expect(linkGuardianToStudent(ctx, {
      studentId,
      guardianId,
      relation: "FATHER"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.guardian.manage");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.guardian.manage",
      branchId
    });
    expect(mocks.tx.guardian.findFirst).not.toHaveBeenCalled();
    expect(mocks.tx.studentGuardianLink.create).not.toHaveBeenCalled();
  });

  it("requires enrollment manage permission before creating enrollments", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.enrollment.manage"));

    await expect(createEnrollment(ctx, {
      branchId,
      academicYearId,
      studentId,
      classSectionId,
      enrolledOn: "2026-04-01"
    })).rejects.toThrow("FORBIDDEN_PERMISSION:academia.enrollment.manage");

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.enrollment.manage",
      branchId
    });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.enrollment.create).not.toHaveBeenCalled();
  });

  it("requires enrollment manage permission before reading enrollment lists", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.enrollment.manage"));

    await expect(listEnrollments(ctx, { branchId, academicYearId })).rejects.toThrow(
      "FORBIDDEN_PERMISSION:academia.enrollment.manage"
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.enrollment.manage",
      branchId,
      academicYearId
    });
    expect(mocks.tx.enrollment.findMany).not.toHaveBeenCalled();
  });

  it("requires enrollment manage for active class-section enrollment reads", async () => {
    mocks.tx.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.enrollment.manage"));

    await expect(listActiveEnrollmentsByClassSection(ctx, classSectionId)).rejects.toThrow(
      "FORBIDDEN_PERMISSION:academia.enrollment.manage"
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.enrollment.manage",
      branchId,
      academicYearId
    });
    expect(mocks.tx.enrollment.findMany).not.toHaveBeenCalled();
  });

  it("requires attendance view permission before loading active enrolled students", async () => {
    mocks.tx.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:academia.attendance.view"));

    await expect(listActiveEnrolledStudentsForAttendance(ctx, { classSectionId })).rejects.toThrow(
      "FORBIDDEN_PERMISSION:academia.attendance.view"
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.attendance.view",
      branchId,
      academicYearId
    });
    expect(mocks.tx.enrollment.findMany).not.toHaveBeenCalled();
  });
});
