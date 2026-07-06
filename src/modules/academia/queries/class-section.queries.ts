import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listClassSectionsSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { accessibleBranchFilter, activeAcademicRecordFilter, pagination, resolveAcademicYearId } from "./shared";

export async function listClassSections(ctx: TenantContext, input: unknown = {}) {
  const params = listClassSectionsSchema.parse(input);
  const branchId = params.branchId ?? ctx.activeBranchId ?? undefined;
  const academicYearId = resolveAcademicYearId(ctx, params.academicYearId);
  if (!branchId || !academicYearId) return [];
  await requirePermission({ ctx, permission: "academia.class.manage", branchId, academicYearId });

  const where: Prisma.ClassSectionWhereInput = {
    tenantId: ctx.tenantId,
    branchId: accessibleBranchFilter(ctx, branchId),
    academicYearId,
    classId: params.classId,
    sectionId: params.sectionId,
    classTeacherUserId: params.classTeacherUserId,
    status: params.status ?? activeAcademicRecordFilter
  };
  if (params.search) {
    where.displayName = { contains: params.search, mode: "insensitive" };
  }

  return db.classSection.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      capacity: true,
      status: true,
      academicClass: { select: { name: true } },
      section: { select: { name: true } },
      branch: { select: { name: true } },
      academicYear: { select: { name: true } },
      classTeacherUser: { select: { displayName: true, firstName: true, lastName: true, email: true } }
    },
    orderBy: [{ academicClass: { sortOrder: "asc" } }, { section: { sortOrder: "asc" } }],
    ...pagination(params)
  });
}

export async function getClassSectionById(ctx: TenantContext, classSectionId: string) {
  const id = idSchema.parse(classSectionId);

  const classSection = await db.classSection.findFirst({
    where: {
      id,
      tenantId: ctx.tenantId,
      branchId: { in: ctx.accessibleBranchIds },
      status: activeAcademicRecordFilter
    },
    select: {
      id: true,
      branchId: true,
      academicYearId: true,
      displayName: true,
      capacity: true,
      status: true,
      academicClass: { select: { name: true } },
      section: { select: { name: true } },
      branch: { select: { name: true } },
      academicYear: { select: { name: true } },
      classTeacherUser: { select: { displayName: true, firstName: true, lastName: true, email: true } }
    }
  });
  if (!classSection) return null;

  await requirePermission({
    ctx,
    permission: "academia.class.manage",
    branchId: classSection.branchId,
    academicYearId: classSection.academicYearId
  });
  return classSection;
}
