import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError, notFound } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { PermissionCode } from "@/lib/rbac/permissions";
import type { TenantContext } from "@/lib/tenant/context";

export type StaffboardDbClient = PrismaClient | Prisma.TransactionClient;

export function conflict(code: string) {
  return new AppError(code, code, 409);
}

export function validationError(code: string) {
  return new AppError(code, code, 400);
}

export function displayName(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" ");
}

export async function requireBranchPermission(ctx: TenantContext, permission: PermissionCode, branchId: string) {
  await requirePermission({ ctx, permission, branchId });
}

export async function ensureActiveBranch(client: StaffboardDbClient, ctx: TenantContext, branchId: string) {
  const branch = await client.branch.findFirst({
    where: { id: branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
    select: { id: true }
  });
  if (!branch) throw notFound("BRANCH_NOT_FOUND");
  return branch;
}
