import { redirect } from "next/navigation";

import {
  getPlatformAdministratorContext,
  isPlatformAdministratorPasswordChangeRequiredError,
  type PlatformAdministratorContext
} from "@/lib/auth/platform-administrator-session";

export async function requireAdministratorContext(): Promise<PlatformAdministratorContext> {
  try {
    return await getPlatformAdministratorContext();
  } catch (error) {
    if (isPlatformAdministratorPasswordChangeRequiredError(error)) {
      redirect("/administrator/account/change-password?required=1");
    }
    redirect("/administrator/login");
  }
}

export async function requireAdministratorContextForPasswordChange(): Promise<PlatformAdministratorContext> {
  try {
    return await getPlatformAdministratorContext({ allowPasswordChangeRequired: true });
  } catch {
    redirect("/administrator/login");
  }
}
