import {
  ACADEMIA_PERMISSIONS,
  ALL_PERMISSIONS,
  NOTIFICATION_PERMISSIONS,
  type PermissionCode,
  STAFFBOARD_LITE_PERMISSIONS
} from "@/lib/rbac/permissions";

export const DEFAULT_ROLE_CODES = [
  "TENANT_OWNER",
  "SUPER_ADMIN",
  "ADMINISTRATOR",
  "PRINCIPAL",
  "ADMIN",
  "OFFICE_STAFF",
  "CLASS_TEACHER",
  "TEACHER",
  "STAFF",
  "PARENT",
  "STUDENT"
] as const;

export type DefaultRoleCode = (typeof DEFAULT_ROLE_CODES)[number];

const tenantContextPermission = ["campuscore.tenant.view"] as const;
const userGovernancePermissions = [
  "campuscore.user.view",
  "campuscore.user.manage",
  "campuscore.user.create",
  "campuscore.user.update",
  "campuscore.user.deactivate",
  "campuscore.user.reset_password"
] as const;
const platformGovernancePermissions = [
  "platform.dashboard.view",
  "platform.tenant.manage",
  "platform.institution.manage",
  "platform.school.view",
  "platform.school.create",
  "platform.school.update",
  "platform.school.deactivate",
  "platform.school.delete",
  "platform.school.update_school_id",
  "platform.user.manage",
  "platform.audit.view"
] as const;

export const PLATFORM_ADMIN_ROLE_CODES = ["TENANT_OWNER", "SUPER_ADMIN", "ADMINISTRATOR", "ADMIN"] as const;
export const PRINCIPAL_ASSIGNABLE_ROLE_CODES = [
  "OFFICE_STAFF",
  "CLASS_TEACHER",
  "TEACHER",
  "STAFF",
  "PARENT",
  "STUDENT"
] as const;

export function isPlatformAdminRoleCode(roleCode: string) {
  return PLATFORM_ADMIN_ROLE_CODES.some((code) => code === roleCode);
}

export function hasPlatformAdminRole(roleCodes: readonly string[] = []) {
  return roleCodes.some(isPlatformAdminRoleCode);
}

export function canAssignRole(actorRoleCodes: readonly string[] = [], targetRoleCode: string) {
  if (hasPlatformAdminRole(actorRoleCodes)) return true;
  return PRINCIPAL_ASSIGNABLE_ROLE_CODES.some((code) => code === targetRoleCode);
}

export const DEFAULT_ROLE_PERMISSION_MAP: Record<DefaultRoleCode, readonly PermissionCode[]> = {
  TENANT_OWNER: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMINISTRATOR: [
    ...platformGovernancePermissions,
    "campuscore.tenant.view",
    "campuscore.audit.view"
  ],
  PRINCIPAL: [
    "campuscore.tenant.view",
    "campuscore.institution.manage",
    "campuscore.branch.manage",
    "campuscore.academic_year.manage",
    ...userGovernancePermissions,
    "campuscore.role.view",
    "campuscore.settings.manage",
    "campuscore.audit.view",
    ...NOTIFICATION_PERMISSIONS,
    ...ACADEMIA_PERMISSIONS,
    "staffboard.staff.view",
    "staffboard.staff.create",
    "staffboard.staff.update",
    "staffboard.staff.deactivate",
    "staffboard.attendance.qr.generate",
    "staffboard.attendance.view",
    "staffboard.attendance.correct",
    "staffboard.attendance.report"
  ],
  ADMIN: [
    ...platformGovernancePermissions,
    "campuscore.tenant.view",
    "campuscore.tenant.manage",
    "campuscore.institution.manage",
    "campuscore.branch.manage",
    "campuscore.academic_year.manage",
    ...userGovernancePermissions,
    "campuscore.role.view",
    "campuscore.role.manage",
    "campuscore.audit.view",
    "campuscore.settings.manage",
    ...NOTIFICATION_PERMISSIONS,
    ...ACADEMIA_PERMISSIONS,
    ...STAFFBOARD_LITE_PERMISSIONS
  ],
  OFFICE_STAFF: [
    ...tenantContextPermission,
    "staffboard.staff.view",
    "staffboard.attendance.qr.generate",
    "staffboard.attendance.self_scan",
    "staffboard.attendance.view",
    "staffboard.attendance.correct",
    "staffboard.attendance.report"
  ],
  CLASS_TEACHER: [
    ...tenantContextPermission,
    "academia.student.view",
    "academia.attendance.view",
    "academia.attendance.mark",
    "academia.attendance.report",
    "staffboard.attendance.self_scan"
  ],
  TEACHER: [
    ...tenantContextPermission,
    "academia.student.view",
    "academia.attendance.view",
    "staffboard.attendance.self_scan"
  ],
  STAFF: [...tenantContextPermission, "staffboard.attendance.self_scan"],
  PARENT: tenantContextPermission,
  STUDENT: tenantContextPermission
};
