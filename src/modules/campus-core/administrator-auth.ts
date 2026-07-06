import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";

export async function requireAdministratorContext() {
  try {
    return await getTenantContext();
  } catch {
    redirect("/administrator/login");
  }
}
