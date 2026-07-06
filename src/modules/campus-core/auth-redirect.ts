import { hasPlatformAdminRole } from "@/lib/rbac/roles";

export function getPostLoginRedirectPath(roleCodes: readonly string[] = []) {
  if (hasPlatformAdminRole(roleCodes)) return "/dashboard";
  if (roleCodes.includes("PRINCIPAL")) return "/dashboard";
  if (roleCodes.includes("OFFICE_STAFF")) return "/dashboard";
  if (roleCodes.includes("CLASS_TEACHER")) return "/academia/attendance/mark";
  if (roleCodes.includes("TEACHER")) return "/dashboard";
  if (roleCodes.includes("STAFF")) return "/staffboard/attendance/scan";
  return "/dashboard";
}
