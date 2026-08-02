import { redirect } from "next/navigation";
import {
  getTenantContext,
  isPasswordChangeRequiredError
} from "@/lib/tenant/context";

export async function requireAuth() {
  try {
    return await getTenantContext();
  } catch (error) {
    if (isPasswordChangeRequiredError(error)) {
      redirect("/account/change-password?required=1");
    }
    redirect("/");
  }
}

export async function requireAuthForPasswordChange() {
  try {
    return await getTenantContext({ allowPasswordChangeRequired: true });
  } catch {
    redirect("/");
  }
}
