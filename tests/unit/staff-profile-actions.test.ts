import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import {
  createStaffProfileAction,
  updateStaffProfileAction
} from "@/modules/staffboard-lite/actions/staff-profile.actions";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const getTenantContext = vi.fn();
  const revalidatePath = vi.fn();
  const createStaffLoginAccess = vi.fn();
  const createStaffProfile = vi.fn();
  const deactivateStaffProfile = vi.fn();
  const disableStaffLoginAccess = vi.fn();
  const updateStaffProfile = vi.fn();

  return {
    createStaffLoginAccess,
    getTenantContext,
    revalidatePath,
    createStaffProfile,
    deactivateStaffProfile,
    disableStaffLoginAccess,
    updateStaffProfile
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/tenant/context", () => ({ getTenantContext: mocks.getTenantContext }));
vi.mock("@/modules/staffboard-lite/services/staff-profile.service", () => ({
  createStaffLoginAccess: mocks.createStaffLoginAccess,
  createStaffProfile: mocks.createStaffProfile,
  deactivateStaffProfile: mocks.deactivateStaffProfile,
  disableStaffLoginAccess: mocks.disableStaffLoginAccess,
  updateStaffProfile: mocks.updateStaffProfile
}));

const tenantId = "00000000-0000-0000-0000-000000000001";
const branchId = "00000000-0000-0000-0000-000000000003";
const staffId = "00000000-0000-0000-0000-000000000005";

const ctx: TenantContext = {
  tenantId,
  userId: "00000000-0000-0000-0000-000000000002",
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000004"
};

const duplicateEmployeeCodeMessage =
  "A staff member with this employee code already exists. Please use a different employee code.";

function staffFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("branchId", branchId);
  formData.set("employeeCode", "EMP-1001");
  formData.set("firstName", "Meera");
  formData.set("staffType", "TEACHER");
  formData.set("employmentStatus", "ACTIVE");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function staffUpdateFormData(overrides: Record<string, string> = {}) {
  const formData = staffFormData(overrides);
  formData.set("staffId", staffId);
  return formData;
}

beforeEach(() => {
  mocks.getTenantContext.mockReset();
  mocks.getTenantContext.mockResolvedValue(ctx);
  mocks.revalidatePath.mockReset();
  mocks.createStaffLoginAccess.mockReset();
  mocks.createStaffProfile.mockReset();
  mocks.deactivateStaffProfile.mockReset();
  mocks.disableStaffLoginAccess.mockReset();
  mocks.updateStaffProfile.mockReset();
});

describe("staff profile server actions", () => {
  it("returns a safe field-level error when a duplicate employee code is submitted on create", async () => {
    mocks.createStaffProfile.mockRejectedValueOnce(new AppError("STAFF_EMPLOYEE_CODE_EXISTS"));

    const result = await createStaffProfileAction({ ok: false }, staffFormData());

    expect(result).toEqual({
      ok: false,
      error: duplicateEmployeeCodeMessage,
      fieldErrors: {
        employeeCode: [duplicateEmployeeCodeMessage]
      }
    });
    expect(mocks.createStaffProfile).toHaveBeenCalledWith(ctx, expect.objectContaining({
      branchId,
      employeeCode: "EMP-1001"
    }));
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("STAFF_EMPLOYEE_CODE_EXISTS");
  });

  it("passes optional login access fields through staff profile creation safely", async () => {
    const result = await createStaffProfileAction({ ok: false }, staffFormData({
      email: "staff-login@example.test",
      phone: "9876543210",
      createLoginAccess: "on",
      loginRoleCode: "STAFF",
      initialPassword: "temporary-123",
      confirmInitialPassword: "temporary-123"
    }));

    expect(result).toEqual({ ok: true, message: "Staff profile created." });
    expect(mocks.createStaffProfile).toHaveBeenCalledWith(ctx, expect.objectContaining({
      email: "staff-login@example.test",
      phone: "9876543210",
      createLoginAccess: true,
      loginRoleCode: "STAFF",
      initialPassword: "temporary-123",
      confirmInitialPassword: "temporary-123"
    }));
  });

  it("returns a safe field-level error for duplicate staff login emails", async () => {
    mocks.createStaffProfile.mockRejectedValueOnce(new AppError("STAFF_LOGIN_EMAIL_EXISTS"));

    const result = await createStaffProfileAction({ ok: false }, staffFormData({
      email: "staff-login@example.test",
      createLoginAccess: "on",
      loginRoleCode: "STAFF",
      initialPassword: "temporary-123",
      confirmInitialPassword: "temporary-123"
    }));

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.email?.[0]).toContain("A user account with this email already exists.");
    expect(JSON.stringify(result)).not.toMatch(/STAFF_LOGIN_EMAIL_EXISTS|passwordHash|temporary-123/);
  });

  it("returns a safe field-level error when a duplicate employee code is submitted on update", async () => {
    mocks.updateStaffProfile.mockRejectedValueOnce(new AppError("STAFF_EMPLOYEE_CODE_EXISTS"));

    const result = await updateStaffProfileAction({ ok: false }, staffUpdateFormData());

    expect(result).toEqual({
      ok: false,
      error: duplicateEmployeeCodeMessage,
      fieldErrors: {
        employeeCode: [duplicateEmployeeCodeMessage]
      }
    });
    expect(mocks.updateStaffProfile).toHaveBeenCalledWith(ctx, expect.objectContaining({
      staffId,
      branchId,
      employeeCode: "EMP-1001"
    }));
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("STAFF_EMPLOYEE_CODE_EXISTS");
  });

  it("maps unknown staff update failures to a generic safe form message", async () => {
    mocks.updateStaffProfile.mockRejectedValueOnce(
      new Error("Prisma failed for tenantId=00000000-0000-0000-0000-000000000001")
    );

    const result = await updateStaffProfileAction({ ok: false }, staffUpdateFormData());

    expect(result).toEqual({
      ok: false,
      error: "Unable to update staff profile. Please try again.",
      fieldErrors: undefined
    });
    expect(JSON.stringify(result)).not.toMatch(/Prisma|tenantId|00000000-0000-0000-0000-000000000001/);
  });
});
