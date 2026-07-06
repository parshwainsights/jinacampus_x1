import { db } from "@/lib/db";
import { isPermissionCode, type PermissionCode } from "@/lib/rbac/permissions";
import { hasPlatformAdminRole } from "@/lib/rbac/roles";
import type { TenantContext } from "@/lib/tenant/context";

type PermissionScopeInput = {
  ctx: TenantContext;
  branchId?: string | null;
  academicYearId?: string | null;
};

type RequirePermissionInput = PermissionScopeInput & {
  permission: PermissionCode;
};

export async function getEffectivePermissions(input: PermissionScopeInput): Promise<Set<PermissionCode>> {
  const { ctx, branchId } = input;
  const now = new Date();
  const academicYearId = input.academicYearId ?? ctx.activeAcademicYearId;

  if (branchId && !ctx.accessibleBranchIds.includes(branchId) && !hasPlatformAdminRole(ctx.roleCodes ?? [])) {
    throw new Error("FORBIDDEN_BRANCH_ACCESS");
  }

  const scopeFilters: Array<{ scopeType: "TENANT" | "BRANCH" | "ACADEMIC_YEAR"; scopeId: string }> = [
    { scopeType: "TENANT", scopeId: "TENANT" }
  ];
  if (branchId) scopeFilters.push({ scopeType: "BRANCH" as const, scopeId: branchId });
  if (academicYearId) scopeFilters.push({ scopeType: "ACADEMIC_YEAR" as const, scopeId: academicYearId });

  const assignments = await db.userRoleAssignment.findMany({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      isActive: true,
      AND: [
        { OR: scopeFilters },
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
      ]
    },
    include: {
      role: {
        include: {
          rolePermissions: { where: { tenantId: ctx.tenantId }, include: { permission: true } }
        }
      }
    }
  });

  const permissions = new Set<PermissionCode>();
  for (const assignment of assignments) {
    if (!assignment.role.isActive || assignment.role.tenantId !== ctx.tenantId) continue;
    for (const rolePermission of assignment.role.rolePermissions) {
      const code = rolePermission.permission.code;
      if (rolePermission.permission.isActive && isPermissionCode(code)) permissions.add(code);
    }
  }

  return permissions;
}

export async function requirePermission(input: RequirePermissionInput) {
  const { permission } = input;
  const permissions = await getEffectivePermissions(input);
  if (!permissions.has(permission)) throw new Error(`FORBIDDEN_PERMISSION:${permission}`);
  return true;
}
