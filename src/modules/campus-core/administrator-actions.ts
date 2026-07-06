"use server";

import { revalidatePath } from "next/cache";
import { mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import {
  createSchoolSchema,
  deactivateSchoolSchema,
  deleteSchoolSchema,
  reactivateSchoolSchema,
  updateSchoolIdSchema,
  updateSchoolSchema
} from "@/modules/campus-core/administrator-schemas";
import {
  createSchool,
  deactivateSchool,
  deleteSchoolIfSafe,
  reactivateSchool,
  updateSchool,
  updateSchoolId
} from "@/modules/campus-core/administrator-services";
import type { CampusCoreFormActionState } from "@/modules/campus-core/actions";

function s(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nullableS(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : null;
}

function req(formData: FormData, key: string) {
  const value = s(formData, key);
  if (!value) throw new Error(`Missing field: ${key}`);
  return value;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function formError(error: unknown, fallbackMessage: string): CampusCoreFormActionState {
  const result = mapActionError(error, {
    fallbackMessage,
    validationMessage: "Please check the highlighted fields and try again."
  });

  return {
    ok: false,
    error: result.error,
    fieldErrors: result.fieldErrors
  };
}

function revalidateAdministratorSchoolRoutes(tenantId?: string) {
  revalidatePath("/administrator");
  revalidatePath("/administrator/schools");
  revalidatePath("/administrator/schools/create");
  if (tenantId) {
    revalidatePath(`/administrator/schools/${tenantId}`);
    revalidatePath(`/administrator/schools/${tenantId}/edit`);
  }
}

export async function createSchoolAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = createSchoolSchema.parse({
      name: req(formData, "name"),
      schoolId: req(formData, "schoolId"),
      institutionDisplayName: nullableS(formData, "institutionDisplayName"),
      supportEmail: s(formData, "supportEmail"),
      status: s(formData, "status") ?? "ACTIVE",
      principalFirstName: s(formData, "principalFirstName"),
      principalLastName: s(formData, "principalLastName"),
      principalEmail: s(formData, "principalEmail"),
      principalInitialPassword: s(formData, "principalInitialPassword"),
      confirmPrincipalInitialPassword: s(formData, "confirmPrincipalInitialPassword")
    });
    const school = await createSchool(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(school.id);
    return { ok: true, message: "School created. Default institution, branch, roles, and attendance settings were prepared." };
  } catch (error) {
    return formError(error, "Unable to create school. Please try again.");
  }
}

export async function updateSchoolAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = updateSchoolSchema.parse({
      tenantId: req(formData, "tenantId"),
      name: s(formData, "name"),
      legalName: nullableS(formData, "legalName"),
      supportEmail: nullableS(formData, "supportEmail"),
      status: s(formData, "status"),
      institutionDisplayName: nullableS(formData, "institutionDisplayName"),
      institutionLogoUrl: nullableS(formData, "institutionLogoUrl")
    });
    await updateSchool(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(input.tenantId);
    return { ok: true, message: "School profile updated." };
  } catch (error) {
    return formError(error, "Unable to update school. Please try again.");
  }
}

export async function updateSchoolIdAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = updateSchoolIdSchema.parse({
      tenantId: req(formData, "tenantId"),
      currentSchoolId: req(formData, "currentSchoolId"),
      newSchoolId: req(formData, "newSchoolId"),
      confirmSchoolIdChange: checked(formData, "confirmSchoolIdChange")
    });
    await updateSchoolId(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(input.tenantId);
    return { ok: true, message: "School ID updated. Users must use the new School ID for future login." };
  } catch (error) {
    return formError(error, "Unable to update School ID. Please try again.");
  }
}

export async function deactivateSchoolAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = deactivateSchoolSchema.parse({
      tenantId: req(formData, "tenantId"),
      confirmDeactivation: checked(formData, "confirmDeactivation")
    });
    await deactivateSchool(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(input.tenantId);
    return { ok: true, message: "School deactivated. Active sessions for that school were revoked." };
  } catch (error) {
    return formError(error, "Unable to deactivate school. Please try again.");
  }
}

export async function reactivateSchoolAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = reactivateSchoolSchema.parse({
      tenantId: req(formData, "tenantId"),
      confirmReactivation: checked(formData, "confirmReactivation")
    });
    await reactivateSchool(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(input.tenantId);
    return { ok: true, message: "School reactivated." };
  } catch (error) {
    return formError(error, "Unable to reactivate school. Please try again.");
  }
}

export async function deleteSchoolAction(
  _state: CampusCoreFormActionState,
  formData: FormData
): Promise<CampusCoreFormActionState> {
  try {
    const input = deleteSchoolSchema.parse({
      tenantId: req(formData, "tenantId"),
      confirmDelete: req(formData, "confirmDelete")
    });
    await deleteSchoolIfSafe(await getTenantContext(), input);
    revalidateAdministratorSchoolRoutes(input.tenantId);
    return { ok: true, message: "School deleted because no dependent data existed." };
  } catch (error) {
    return formError(error, "Unable to delete school. Deactivation is the safer option when school data exists.");
  }
}
