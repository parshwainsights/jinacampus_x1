import { toPagination } from "@/lib/pagination";
import type { TenantContext } from "@/lib/tenant/context";

export const activeAcademicRecordFilter = { not: "ARCHIVED" } as const;

export function accessibleBranchFilter(ctx: TenantContext, branchId?: string) {
  if (branchId) return branchId;
  return { in: ctx.accessibleBranchIds };
}

export function hasNoBranchAccess(ctx: TenantContext, branchId?: string) {
  return !branchId && ctx.accessibleBranchIds.length === 0;
}

export function resolveAcademicYearId(ctx: TenantContext, academicYearId?: string) {
  return academicYearId ?? ctx.activeAcademicYearId ?? undefined;
}

export function pagination(input: { page?: number; pageSize?: number }) {
  const { skip, take } = toPagination(input);
  return { skip, take };
}
