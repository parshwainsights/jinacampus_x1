import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listGuardiansSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { pagination } from "./shared";

export async function listGuardians(ctx: TenantContext, input: unknown = {}) {
  const params = listGuardiansSchema.parse(input);
  await requirePermission({ ctx, permission: "academia.guardian.manage" });

  const where: Prisma.GuardianWhereInput = {
    tenantId: ctx.tenantId,
    phone: params.phone,
    email: params.email
  };
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { middleName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { displayName: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } }
    ];
  }

  return db.guardian.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      displayName: true,
      phone: true,
      email: true
    },
    orderBy: [{ displayName: "asc" }, { firstName: "asc" }],
    ...pagination(params)
  });
}

export async function getGuardianById(ctx: TenantContext, guardianId: string) {
  const id = idSchema.parse(guardianId);
  await requirePermission({ ctx, permission: "academia.guardian.manage" });

  return db.guardian.findFirst({
    where: { id, tenantId: ctx.tenantId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      displayName: true,
      phone: true,
      email: true,
      occupation: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true
    }
  });
}

export async function listGuardiansByStudent(ctx: TenantContext, studentId: string) {
  const id = idSchema.parse(studentId);
  const student = await db.student.findFirst({
    where: { id, tenantId: ctx.tenantId, branchId: { in: ctx.accessibleBranchIds } },
    select: { id: true, branchId: true }
  });
  if (!student) return [];

  await requirePermission({ ctx, permission: "academia.guardian.manage", branchId: student.branchId });

  return db.studentGuardianLink.findMany({
    where: { tenantId: ctx.tenantId, studentId: student.id },
    select: {
      id: true,
      relation: true,
      isPrimary: true,
      isEmergencyContact: true,
      hasPickupPermission: true,
      guardian: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          displayName: true,
          phone: true,
          email: true,
          occupation: true
        }
      }
    },
    orderBy: [{ isPrimary: "desc" }, { relation: "asc" }]
  });
}
