import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { createStudentAction } from "@/modules/academia/actions/profile.actions";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const createClass = vi.fn();
  const createStudent = vi.fn();
  const getTenantContext = vi.fn();
  const revalidatePath = vi.fn();
  const updateClass = vi.fn();
  const updateEnrollment = vi.fn();
  const updateGuardian = vi.fn();
  const updateSection = vi.fn();
  const updateStudent = vi.fn();
  const updateSubject = vi.fn();

  return {
    createClass,
    createStudent,
    getTenantContext,
    revalidatePath,
    updateClass,
    updateEnrollment,
    updateGuardian,
    updateSection,
    updateStudent,
    updateSubject
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/tenant/context", () => ({ getTenantContext: mocks.getTenantContext }));
vi.mock("@/modules/academia/services/class.service", () => ({
  createClass: mocks.createClass,
  updateClass: mocks.updateClass
}));
vi.mock("@/modules/academia/services/enrollment.service", () => ({
  updateEnrollment: mocks.updateEnrollment
}));
vi.mock("@/modules/academia/services/guardian.service", () => ({
  updateGuardian: mocks.updateGuardian
}));
vi.mock("@/modules/academia/services/section.service", () => ({
  updateSection: mocks.updateSection
}));
vi.mock("@/modules/academia/services/student.service", () => ({
  createStudent: mocks.createStudent,
  updateStudent: mocks.updateStudent
}));
vi.mock("@/modules/academia/services/subject.service", () => ({
  updateSubject: mocks.updateSubject
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

const duplicateAdmissionMessage =
  "A student with this admission number already exists. Please use a different admission number.";

function studentFormData() {
  const formData = new FormData();
  formData.set("branchId", branchId);
  formData.set("admissionNumber", "ADM-001");
  formData.set("admissionDate", "2026-04-01");
  formData.set("fullName", "Aarav Sharma");
  formData.set("dateOfBirth", "2018-01-10");
  formData.set("fatherName", "Nilesh Sharma");
  formData.set("motherName", "Kavita Sharma");
  formData.set("aadhaarNumber", "1234 1234 1234");
  formData.set("religion", "Hindu");
  formData.set("caste", "General");
  formData.set("category", "General");
  formData.set("nationality", "India");
  formData.set("city", "Ahmedabad");
  formData.set("state", "Gujarat");
  formData.set("gender", "NOT_SPECIFIED");
  formData.set("status", "ACTIVE");
  return formData;
}

beforeEach(() => {
  mocks.createClass.mockReset();
  mocks.createStudent.mockReset();
  mocks.getTenantContext.mockReset();
  mocks.getTenantContext.mockResolvedValue(ctx);
  mocks.revalidatePath.mockReset();
  mocks.updateClass.mockReset();
  mocks.updateEnrollment.mockReset();
  mocks.updateGuardian.mockReset();
  mocks.updateSection.mockReset();
  mocks.updateStudent.mockReset();
  mocks.updateSubject.mockReset();
});

describe("profile server actions", () => {
  it("returns a safe field-level error when a duplicate student admission number is submitted", async () => {
    mocks.createStudent.mockRejectedValueOnce(new AppError("STUDENT_ADMISSION_NUMBER_EXISTS"));

    const result = await createStudentAction({ ok: false }, studentFormData());

    expect(result).toEqual({
      ok: false,
      error: duplicateAdmissionMessage,
      fieldErrors: {
        admissionNumber: [duplicateAdmissionMessage],
        admissionNo: [duplicateAdmissionMessage]
      }
    });
    expect(mocks.createStudent).toHaveBeenCalledWith(ctx, expect.objectContaining({
      admissionNumber: "ADM-001",
      branchId
    }));
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("STUDENT_ADMISSION_NUMBER_EXISTS");
  });

  it("does not throw the duplicate admission AppError to the page runtime", async () => {
    mocks.createStudent.mockRejectedValueOnce(new AppError("STUDENT_ADMISSION_NUMBER_EXISTS"));

    await expect(createStudentAction({ ok: false }, studentFormData())).resolves.toMatchObject({
      ok: false,
      error: duplicateAdmissionMessage
    });
  });

  it("maps unknown create student failures to the generic safe form message", async () => {
    mocks.createStudent.mockRejectedValueOnce(
      new Error("Prisma failed for tenantId=00000000-0000-0000-0000-000000000001")
    );

    const result = await createStudentAction({ ok: false }, studentFormData());

    expect(result).toEqual({
      ok: false,
      error: "Unable to create student. Please try again.",
      fieldErrors: undefined
    });
    expect(JSON.stringify(result)).not.toMatch(/Prisma|tenantId|00000000-0000-0000-0000-000000000001/);
  });
});
