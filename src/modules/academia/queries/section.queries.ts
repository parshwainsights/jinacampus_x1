import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listSectionsSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { activeAcademicRecordFilter, pagination } from "./shared";

export async function listSections(ctx: TenantContext, input: unknown = {}) {
  const params = listSectionsSchema.parse(input);
  await requirePermission({ ctx, permission: "academia.section.manage" });

  const where: Prisma.SectionWhereInput = {
    tenantId: ctx.tenantId,
    status: params.status ?? activeAcademicRecordFilter
  };
  if (params.search) {
    where.OR = [
      { code: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } }
    ];
  }

  return db.section.findMany({
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

export async function getSectionById(ctx: TenantContext, sectionId: string) {
  const id = idSchema.parse(sectionId);
  await requirePermission({ ctx, permission: "academia.section.manage" });

  return db.section.findFirst({
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
