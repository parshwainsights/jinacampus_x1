import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError, notFound } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { PermissionCode } from "@/lib/rbac/permissions";
import type { TenantContext } from "@/lib/tenant/context";

export type AcademiaDbClient = PrismaClient | Prisma.TransactionClient;

export function conflict(code: string) {
  return new AppError(code, code, 409);
}

export function validationError(code: string) {
  return new AppError(code, code, 400);
}

export function displayName(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" ");
}

export async function requireTenantPermission(ctx: TenantContext, permission: PermissionCode) {
  await requirePermission({ ctx, permission });
}

export async function requireBranchPermission(ctx: TenantContext, permission: PermissionCode, branchId: string) {
  await requirePermission({ ctx, permission, branchId });
}

export async function ensureActiveBranch(client: AcademiaDbClient, ctx: TenantContext, branchId: string) {
  const branch = await client.branch.findFirst({
    where: { id: branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
    select: { id: true }
  });
  if (!branch) throw notFound("BRANCH_NOT_FOUND");
  return branch;
}

export async function ensureAcademicYear(client: AcademiaDbClient, ctx: TenantContext, academicYearId: string) {
  const academicYear = await client.academicYear.findFirst({
    where: { id: academicYearId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
    select: { id: true }
  });
  if (!academicYear) throw notFound("ACADEMIC_YEAR_NOT_FOUND");
  return academicYear;
}

export async function ensureActiveClass(client: AcademiaDbClient, ctx: TenantContext, classId: string) {
  const academicClass = await client.class.findFirst({
    where: { id: classId, tenantId: ctx.tenantId, status: "ACTIVE" },
    select: { id: true }
  });
  if (!academicClass) throw notFound("CLASS_NOT_FOUND");
  return academicClass;
}

export async function ensureActiveSection(client: AcademiaDbClient, ctx: TenantContext, sectionId: string) {
  const section = await client.section.findFirst({
    where: { id: sectionId, tenantId: ctx.tenantId, status: "ACTIVE" },
    select: { id: true }
  });
  if (!section) throw notFound("SECTION_NOT_FOUND");
  return section;
}

export async function ensureClassTeacherAccess(
  client: AcademiaDbClient,
  ctx: TenantContext,
  classTeacherUserId: string | undefined,
  branchId: string
) {
  if (!classTeacherUserId) return;

  const user = await client.user.findFirst({
    where: {
      id: classTeacherUserId,
      tenantId: ctx.tenantId,
      status: "ACTIVE",
      branchAccesses: { some: { tenantId: ctx.tenantId, branchId, isActive: true } }
    },
    select: { id: true }
  });
  if (!user) throw notFound("CLASS_TEACHER_NOT_FOUND");
}
