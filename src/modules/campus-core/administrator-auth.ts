import { redirect } from "next/navigation";
import {
  getTenantContext,
  isPasswordChangeRequiredError,
  type TenantContext
} from "@/lib/tenant/context";
import { hasPlatformAdminRole } from "@/lib/rbac/roles";

export async function requireAdministratorContext() {
  let ctx: TenantContext;

  try {
    ctx = await getTenantContext();
  } catch (error) {
    if (isPasswordChangeRequiredError(error)) {
      redirect("/account/change-password?required=1");
    }
    redirect("/administrator/login");
  }

  if (!hasPlatformAdminRole(ctx.roleCodes ?? [])) redirect("/dashboard");
  return ctx;
}
