import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createClass, updateClass } from "@/modules/academia/services/class.service";
import { createEnrollment } from "@/modules/academia/services/enrollment.service";
import { createGuardian, linkGuardianToStudent } from "@/modules/academia/services/guardian.service";
import { createStudent } from "@/modules/academia/services/student.service";
import { listClasses } from "@/modules/academia/queries/class.queries";
import { listActiveEnrollmentsByClassSection } from "@/modules/academia/queries/enrollment.queries";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    academicYear: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    branch: { findFirst: vi.fn() },
    class: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    classSection: { findFirst: vi.fn() },
    enrollment: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    guardian: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    section: { findFirst: vi.fn() },
    student: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    studentGuardianLink: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    subject: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findFirst: vi.fn() }
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
const classId = "00000000-0000-0000-0000-000000000005";
const sectionId = "00000000-0000-0000-0000-000000000006";
const classSectionId = "00000000-0000-0000-0000-000000000007";
const studentId = "00000000-0000-0000-0000-000000000008";
const guardianId = "00000000-0000-0000-0000-000000000009";

function validStudentInput(overrides: Record<string, unknown> = {}) {
  return {
    branchId,
    admissionNumber: "ADM-1",
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
    state: "Gujarat",
    ...overrides
  };
}

function resetMocks() {
  for (const model of Object.values(mocks.tx)) {
    for (const method of Object.values(model)) {
      method.mockReset();
    }
  }
  mocks.db.$transaction.mockReset();
  mocks.db.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
  mocks.writeAuditLog.mockReset();
  mocks.writeAuditLog.mockResolvedValue({ id: "audit-id" });
}

describe("Academia services and queries", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("createClass validates input, requires permission, and scopes by tenant", async () => {
    const created = { id: classId, tenantId: ctx.tenantId, code: "C1", name: "Class I" };
    mocks.tx.class.findFirst.mockResolvedValue(null);
    mocks.tx.class.create.mockResolvedValue(created);

    await expect(createClass(ctx, { code: "C1", name: "Class I" })).resolves.toBe(created);

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "academia.class.manage" });
    expect(mocks.tx.class.create).toHaveBeenCalledWith({
      data: { code: "C1", name: "Class I", tenantId: ctx.tenantId, createdById: ctx.userId }
    });
  });

  it("listClasses returns only current tenant records", async () => {
    mocks.tx.class.findMany.mockResolvedValue([]);

    await listClasses(ctx, { search: "Class" });

    expect(mocks.tx.class.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: ctx.tenantId })
    }));
  });

  it("createStudent preserves tenant admission number uniqueness", async () => {
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId });

    await expect(createStudent(ctx, {
      ...validStudentInput()
    })).rejects.toMatchObject({ code: "STUDENT_ADMISSION_NUMBER_EXISTS", status: 409 });

    expect(mocks.tx.student.findFirst).toHaveBeenCalledWith({
      where: { tenantId: ctx.tenantId, admissionNumber: "ADM-1" },
      select: { id: true }
    });
    expect(mocks.tx.student.create).not.toHaveBeenCalled();
  });

  it("createStudent stores only masked sensitive identity and bank fields", async () => {
    const created = {
      id: studentId,
      tenantId: ctx.tenantId,
      branchId,
      admissionNumber: "ADM-2",
      aadhaarMasked: "XXXX-XXXX-1234",
      bankAccountMasked: "XXXXXX9012"
    };
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
    mocks.tx.student.findFirst.mockResolvedValue(null);
    mocks.tx.student.create.mockResolvedValue(created);

    await expect(createStudent(ctx, validStudentInput({
      admissionNumber: "ADM-2",
      bankAccountNumber: "123456789012"
    }))).resolves.toBe(created);

    expect(JSON.stringify(mocks.tx.student.create.mock.calls)).not.toMatch(/123412341234|123456789012|aadhaarNumber|bankAccountNumber/);
    expect(mocks.tx.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        aadhaarMasked: "XXXX-XXXX-1234",
        aadhaarLast4: "1234",
        bankAccountMasked: "XXXXXX9012",
        bankAccountLast4: "9012"
      })
    });
    expect(JSON.stringify(mocks.writeAuditLog.mock.calls)).not.toMatch(/123412341234|123456789012|aadhaarNumber|bankAccountNumber/);
  });

  it("createGuardian and linkGuardianToStudent work for the same tenant", async () => {
    const guardian = { id: guardianId, tenantId: ctx.tenantId, firstName: "Meera", displayName: "Meera" };
    const link = { id: "00000000-0000-0000-0000-000000000010", tenantId: ctx.tenantId, studentId, guardianId };
    mocks.tx.guardian.findFirst.mockResolvedValue(null);
    mocks.tx.guardian.create.mockResolvedValue(guardian);

    await expect(createGuardian(ctx, { firstName: "Meera", phone: "9876543210" })).resolves.toBe(guardian);

    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId, branchId });
    mocks.tx.guardian.findFirst.mockResolvedValue({ id: guardianId });
    mocks.tx.studentGuardianLink.findFirst.mockResolvedValue(null);
    mocks.tx.studentGuardianLink.create.mockResolvedValue(link);

    await expect(linkGuardianToStudent(ctx, {
      studentId,
      guardianId,
      relation: "MOTHER",
      isPrimary: true
    })).resolves.toBe(link);

    expect(mocks.tx.studentGuardianLink.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: ctx.tenantId, studentId, guardianId, relation: "MOTHER" })
    });
  });

  it("rejects cross-tenant guardian/student linking", async () => {
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId, branchId });
    mocks.tx.guardian.findFirst.mockResolvedValue(null);

    await expect(linkGuardianToStudent(ctx, {
      studentId,
      guardianId,
      relation: "FATHER"
    })).rejects.toMatchObject({ code: "GUARDIAN_NOT_FOUND" });

    expect(mocks.tx.guardian.findFirst).toHaveBeenCalledWith({
      where: { id: guardianId, tenantId: ctx.tenantId },
      select: { id: true }
    });
  });

  it("createEnrollment rejects duplicate enrollment in the same academic year", async () => {
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
    mocks.tx.academicYear.findFirst.mockResolvedValue({ id: academicYearId });
    mocks.tx.student.findFirst.mockResolvedValue({ id: studentId });
    mocks.tx.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.tx.enrollment.findFirst.mockResolvedValue({ id: "existing", status: "ACTIVE" });

    await expect(createEnrollment(ctx, {
      branchId,
      academicYearId,
      studentId,
      classSectionId,
      enrolledOn: "2026-04-01"
    })).rejects.toMatchObject({ code: "ENROLLMENT_ALREADY_EXISTS_FOR_ACADEMIC_YEAR" });
  });

  it("listActiveEnrollmentsByClassSection is tenant, branch, and academic-year scoped", async () => {
    mocks.tx.classSection.findFirst.mockResolvedValue({ id: classSectionId, branchId, academicYearId });
    mocks.tx.enrollment.findMany.mockResolvedValue([]);

    await listActiveEnrollmentsByClassSection(ctx, classSectionId);

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "academia.enrollment.manage",
      branchId,
      academicYearId
    });
    expect(mocks.tx.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId: ctx.tenantId,
        branchId,
        academicYearId,
        classSectionId,
        status: "ACTIVE"
      }
    }));
  });

  it("update operations create audit logs", async () => {
    const before = { id: classId, tenantId: ctx.tenantId, code: "C1", name: "Class I" };
    const after = { ...before, name: "Class One" };
    mocks.tx.class.findFirst.mockResolvedValueOnce(before).mockResolvedValueOnce(null);
    mocks.tx.class.update.mockResolvedValue(after);

    await updateClass(ctx, { classId, name: "Class One" });

    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_UPDATED,
      entityType: "Class",
      entityId: classId,
      before,
      after
    }), mocks.tx);
  });
});
