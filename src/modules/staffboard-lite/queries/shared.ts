import { toPagination } from "@/lib/pagination";
import type { TenantContext } from "@/lib/tenant/context";

export function resolveStaffBranchIds(ctx: TenantContext, branchId?: string) {
  if (branchId) return [branchId];
  if (ctx.activeBranchId) return [ctx.activeBranchId];
  return ctx.accessibleBranchIds;
}

export function hasNoBranchAccess(ctx: TenantContext, branchId?: string) {
  return !branchId && !ctx.activeBranchId && ctx.accessibleBranchIds.length === 0;
}

export function pagination(input: { page?: number; pageSize?: number }) {
  const { skip, take } = toPagination(input);
  return { skip, take };
}
