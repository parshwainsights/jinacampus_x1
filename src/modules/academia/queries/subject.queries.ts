import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listSubjectsSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { activeAcademicRecordFilter, pagination } from "./shared";

export async function listSubjects(ctx: TenantContext, input: unknown = {}) {
  const params = listSubjectsSchema.parse(input);
  await requirePermission({ ctx, permission: "academia.subject.manage" });

  const where: Prisma.SubjectWhereInput = {
    tenantId: ctx.tenantId,
    status: params.status ?? activeAcademicRecordFilter,
    type: params.type
  };
  if (params.search) {
    where.OR = [
      { code: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } }
    ];
  }

  return db.subject.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      description: true,
      status: true,
      updatedAt: true
    },
    orderBy: [{ name: "asc" }],
    ...pagination(params)
  });
}

export async function getSubjectById(ctx: TenantContext, subjectId: string) {
  const id = idSchema.parse(subjectId);
  await requirePermission({ ctx, permission: "academia.subject.manage" });

  return db.subject.findFirst({
    where: { id, tenantId: ctx.tenantId, status: activeAcademicRecordFilter },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      description: true,
      status: true
    }
  });
}
