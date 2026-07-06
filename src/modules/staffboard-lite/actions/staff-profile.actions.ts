"use server";

import { revalidatePath } from "next/cache";
import { mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import {
  createStaffLoginAccessSchema,
  createStaffProfileSchema,
  disableStaffLoginAccessSchema,
  updateStaffProfileSchema
} from "@/modules/staffboard-lite/schemas";
import {
  createStaffLoginAccess,
  createStaffProfile,
  deactivateStaffProfile,
  disableStaffLoginAccess,
  updateStaffProfile
} from "@/modules/staffboard-lite/services/staff-profile.service";

export type StaffProfileFormActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const duplicateEmployeeCodeMessage =
  "A staff member with this employee code already exists. Please use a different employee code.";
const duplicateLoginEmailMessage =
  "A user account with this email already exists. Use another email or manage the existing account from CampusCore users.";
const duplicateLoginPhoneMessage =
  "A user account with this mobile number already exists. Use another mobile number or manage the existing account from CampusCore users.";
const loginAccessAlreadyEnabledMessage = "This staff profile already has login access enabled.";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!value) throw new Error(`Missing field: ${key}`);
  return value;
}

function staffProfileFormError(error: unknown, fallbackMessage: string): StaffProfileFormActionState {
  const result = mapActionError(error, {
    fallbackMessage,
    validationMessage: "Please check the highlighted fields and try again."
  });

  if (result.code === "STAFF_EMPLOYEE_CODE_EXISTS") {
    return {
      ok: false,
      error: duplicateEmployeeCodeMessage,
      fieldErrors: {
        ...(result.fieldErrors ?? {}),
        employeeCode: [duplicateEmployeeCodeMessage]
      }
    };
  }
  if (result.code === "STAFF_LOGIN_EMAIL_EXISTS") {
    return {
      ok: false,
      error: duplicateLoginEmailMessage,
      fieldErrors: {
        ...(result.fieldErrors ?? {}),
        email: [duplicateLoginEmailMessage]
      }
    };
  }
  if (result.code === "STAFF_LOGIN_PHONE_EXISTS") {
    return {
      ok: false,
      error: duplicateLoginPhoneMessage,
      fieldErrors: {
        ...(result.fieldErrors ?? {}),
        phone: [duplicateLoginPhoneMessage]
      }
    };
  }
  if (result.code === "STAFF_LOGIN_ACCESS_ALREADY_ENABLED") {
    return {
      ok: false,
      error: loginAccessAlreadyEnabledMessage,
      fieldErrors: result.fieldErrors
    };
  }

  return {
    ok: false,
    error: result.error,
    fieldErrors: result.fieldErrors
  };
}

export async function createStaffProfileAction(
  _state: StaffProfileFormActionState,
  formData: FormData
): Promise<StaffProfileFormActionState> {
  try {
    const input = createStaffProfileSchema.parse({
      branchId: requiredStringValue(formData, "branchId"),
      employeeCode: requiredStringValue(formData, "employeeCode"),
      firstName: requiredStringValue(formData, "firstName"),
      middleName: stringValue(formData, "middleName"),
      lastName: stringValue(formData, "lastName"),
      staffType: requiredStringValue(formData, "staffType"),
      designation: stringValue(formData, "designation"),
      department: stringValue(formData, "department"),
      phone: stringValue(formData, "phone"),
      email: stringValue(formData, "email"),
      joiningDate: stringValue(formData, "joiningDate"),
      employmentStatus: stringValue(formData, "employmentStatus"),
      createLoginAccess: formData.get("createLoginAccess") === "on",
      loginRoleCode: stringValue(formData, "loginRoleCode"),
      initialPassword: stringValue(formData, "initialPassword"),
      confirmInitialPassword: stringValue(formData, "confirmInitialPassword")
    });
    const ctx = await getTenantContext();
    await createStaffProfile(ctx, input);
    revalidatePath("/staffboard");
    revalidatePath("/staffboard/staff");
    revalidatePath("/staffboard/attendance");
    revalidatePath("/staffboard/attendance/reports");
    revalidatePath("/dashboard");
    return { ok: true, message: "Staff profile created." };
  } catch (error) {
    return staffProfileFormError(error, "Unable to create staff profile. Please try again.");
  }
}

export async function createStaffLoginAccessAction(
  _state: StaffProfileFormActionState,
  formData: FormData
): Promise<StaffProfileFormActionState> {
  try {
    const input = createStaffLoginAccessSchema.parse({
      staffId: requiredStringValue(formData, "staffId"),
      email: stringValue(formData, "email"),
      phone: stringValue(formData, "phone"),
      loginRoleCode: stringValue(formData, "loginRoleCode"),
      initialPassword: stringValue(formData, "initialPassword"),
      confirmInitialPassword: stringValue(formData, "confirmInitialPassword")
    });
    const ctx = await getTenantContext();
    await createStaffLoginAccess(ctx, input);
    revalidatePath("/staffboard");
    revalidatePath("/staffboard/staff");
    revalidatePath(`/staffboard/staff/${input.staffId}/edit`);
    revalidatePath("/campus-core/users");
    revalidatePath("/dashboard");
    return { ok: true, message: "Login access created. The staff member must change the temporary password after first login." };
  } catch (error) {
    return staffProfileFormError(error, "Unable to create staff login access. Please try again.");
  }
}

export async function disableStaffLoginAccessAction(
  _state: StaffProfileFormActionState,
  formData: FormData
): Promise<StaffProfileFormActionState> {
  try {
    const input = disableStaffLoginAccessSchema.parse({
      staffId: requiredStringValue(formData, "staffId"),
      confirmDisableLoginAccess: formData.get("confirmDisableLoginAccess") === "on"
    });
    const ctx = await getTenantContext();
    await disableStaffLoginAccess(ctx, input);
    revalidatePath("/staffboard");
    revalidatePath("/staffboard/staff");
    revalidatePath(`/staffboard/staff/${input.staffId}/edit`);
    revalidatePath("/campus-core/users");
    revalidatePath("/dashboard");
    return { ok: true, message: "Login access disabled. Existing sessions were revoked." };
  } catch (error) {
    return staffProfileFormError(error, "Unable to disable staff login access. Please try again.");
  }
}

export async function updateStaffProfileAction(
  _state: StaffProfileFormActionState,
  formData: FormData
): Promise<StaffProfileFormActionState> {
  try {
    const input = updateStaffProfileSchema.parse({
      staffId: requiredStringValue(formData, "staffId"),
      branchId: requiredStringValue(formData, "branchId"),
      employeeCode: requiredStringValue(formData, "employeeCode"),
      firstName: requiredStringValue(formData, "firstName"),
      middleName: stringValue(formData, "middleName"),
      lastName: stringValue(formData, "lastName"),
      staffType: requiredStringValue(formData, "staffType"),
      designation: stringValue(formData, "designation"),
      department: stringValue(formData, "department"),
      phone: stringValue(formData, "phone"),
      email: stringValue(formData, "email"),
      joiningDate: stringValue(formData, "joiningDate"),
      employmentStatus: stringValue(formData, "employmentStatus")
    });
    const ctx = await getTenantContext();
    await updateStaffProfile(ctx, input);
    revalidatePath("/staffboard");
    revalidatePath("/staffboard/staff");
    revalidatePath(`/staffboard/staff/${input.staffId}/edit`);
    revalidatePath("/staffboard/attendance");
    revalidatePath("/staffboard/attendance/reports");
    revalidatePath("/dashboard");
    return { ok: true, message: "Staff profile updated." };
  } catch (error) {
    return staffProfileFormError(error, "Unable to update staff profile. Please try again.");
  }
}

export async function deactivateStaffProfileAction(
  _state: StaffProfileFormActionState,
  formData: FormData
): Promise<StaffProfileFormActionState> {
  try {
    const staffId = requiredStringValue(formData, "staffId");
    if (formData.get("confirmDeactivation") !== "on") {
      return {
        ok: false,
        error: "Confirm that this staff profile should be deactivated.",
        fieldErrors: { confirmDeactivation: ["Confirm that this staff profile should be deactivated."] }
      };
    }
    const ctx = await getTenantContext();
    await deactivateStaffProfile(ctx, staffId);
    revalidatePath("/staffboard");
    revalidatePath("/staffboard/staff");
    revalidatePath(`/staffboard/staff/${staffId}/edit`);
    revalidatePath("/staffboard/attendance");
    revalidatePath("/staffboard/attendance/reports");
    revalidatePath("/dashboard");
    return { ok: true, message: "Staff profile deactivated." };
  } catch (error) {
    return staffProfileFormError(error, "Unable to deactivate staff profile. Please try again.");
  }
}
