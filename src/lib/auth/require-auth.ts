import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";

export async function requireAuth() {
  try {
    return await getTenantContext();
  } catch {
    redirect("/login");
  }
}
