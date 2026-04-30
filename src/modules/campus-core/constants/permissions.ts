export const CAMPUSCORE_PERMISSIONS = [
  "campuscore.tenant.view",
  "campuscore.institution.manage",
  "campuscore.branch.manage",
  "campuscore.academic_year.manage",
  "campuscore.user.view",
  "campuscore.user.create",
  "campuscore.user.update",
  "campuscore.role.view",
  "campuscore.role.manage",
  "campuscore.audit.view",
  "campuscore.settings.manage",
] as const;

export const DEFAULT_ROLES = [
  "TENANT_OWNER",
  "PRINCIPAL",
  "ADMIN",
  "CLASS_TEACHER",
  "TEACHER",
  "STAFF",
  "PARENT",
  "STUDENT",
] as const;
