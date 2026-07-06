import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listClassesSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { activeAcademicRecordFilter, pagination } from "./shared";

export async function listClasses(ctx: TenantContext, input: unknown = {}) {
  const params = listClassesSchema.parse(input);
  await requirePermission({ ctx, permission: "academia.class.manage" });

  const where: Prisma.ClassWhereInput = {
    tenantId: ctx.tenantId,
    status: params.status ?? activeAcademicRecordFilter
  };
  if (params.search) {
    where.OR = [
      { code: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } }
    ];
  }

  return db.class.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      sortOrder: true,
      status: true,
      updatedAt: true
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    ...pagination(params)
  });
}

export async function getClassById(ctx: TenantContext, classId: string) {
  const id = idSchema.parse(classId);
  await requirePermission({ ctx, permission: "academia.class.manage" });

  return db.class.findFirst({
    where: { id, tenantId: ctx.tenantId, status: activeAcademicRecordFilter },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      sortOrder: true,
      status: true
    }
  });
}
