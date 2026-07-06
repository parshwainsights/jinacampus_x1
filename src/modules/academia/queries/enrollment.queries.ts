import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { listEnrollmentsSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { pagination, resolveAcademicYearId } from "./shared";

const enrollmentListSelect = {
  id: true,
  rollNumber: true,
  status: true,
  enrolledOn: true,
  leftOn: true,
  student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true, displayName: true } },
  classSection: { select: { id: true, displayName: true } },
  branch: { select: { name: true } },
  academicYear: { select: { name: true } }
} as const;

const enrollmentDetailSelect = {
  ...enrollmentListSelect,
  branchId: true,
  academicYearId: true,
  studentId: true,
  classSectionId: true,
  classSection: {
    select: {
      id: true,
      displayName: true,
      academicClass: { select: { name: true, code: true } },
      section: { select: { name: true, code: true } }
    }
  }
} as const;

export async function listEnrollments(ctx: TenantContext, input: unknown = {}) {
  const params = listEnrollmentsSchema.parse(input);
  const branchId = params.branchId ?? ctx.activeBranchId ?? undefined;
  const academicYearId = resolveAcademicYearId(ctx, params.academicYearId);
  if (!branchId || !academicYearId) return [];
  await requirePermission({ ctx, permission: "academia.enrollment.manage", branchId, academicYearId });

  const where: Prisma.EnrollmentWhereInput = {
    tenantId: ctx.tenantId,
    branchId,
    academicYearId,
    studentId: params.studentId,
    classSectionId: params.classSectionId,
    status: params.status
  };
  if (params.search) {
    where.OR = [
      { rollNumber: { contains: params.search, mode: "insensitive" } },
      { student: { admissionNumber: { contains: params.search, mode: "insensitive" } } },
      { student: { displayName: { contains: params.search, mode: "insensitive" } } }
    ];
  }

  return db.enrollment.findMany({
    where,
    select: enrollmentListSelect,
    orderBy: [{ classSection: { displayName: "asc" } }, { rollNumber: "asc" }, { student: { displayName: "asc" } }],
    ...pagination(params)
  });
}

export async function getEnrollmentById(ctx: TenantContext, enrollmentId: string) {
  const id = idSchema.parse(enrollmentId);
  const enrollment = await db.enrollment.findFirst({
    where: { id, tenantId: ctx.tenantId, branchId: { in: ctx.accessibleBranchIds } },
    select: enrollmentDetailSelect
  });
  if (!enrollment) return null;

  await requirePermission({
    ctx,
    permission: "academia.enrollment.manage",
    branchId: enrollment.branchId,
    academicYearId: enrollment.academicYearId
  });
  return enrollment;
}

export async function getActiveEnrollmentByStudent(
  ctx: TenantContext,
  studentId: string,
  academicYearId = ctx.activeAcademicYearId ?? undefined
) {
  const id = idSchema.parse(studentId);
  if (!academicYearId) return null;

  const student = await db.student.findFirst({
    where: { id, tenantId: ctx.tenantId, branchId: { in: ctx.accessibleBranchIds } },
    select: { id: true, branchId: true }
  });
  if (!student) return null;

  await requirePermission({ ctx, permission: "academia.enrollment.manage", branchId: student.branchId, academicYearId });

  return db.enrollment.findFirst({
    where: {
      tenantId: ctx.tenantId,
      branchId: student.branchId,
      academicYearId,
      studentId: student.id,
      status: "ACTIVE"
    },
    select: enrollmentDetailSelect
  });
}

export async function listActiveEnrollmentsByClassSection(ctx: TenantContext, classSectionId: string) {
  const id = idSchema.parse(classSectionId);
  const classSection = await db.classSection.findFirst({
    where: { id, tenantId: ctx.tenantId, branchId: { in: ctx.accessibleBranchIds }, status: "ACTIVE" },
    select: { id: true, branchId: true, academicYearId: true }
  });
  if (!classSection) return [];

  await requirePermission({
    ctx,
    permission: "academia.enrollment.manage",
    branchId: classSection.branchId,
    academicYearId: classSection.academicYearId
  });

  return db.enrollment.findMany({
    where: {
      tenantId: ctx.tenantId,
      branchId: classSection.branchId,
      academicYearId: classSection.academicYearId,
      classSectionId: classSection.id,
      status: "ACTIVE"
    },
    select: enrollmentDetailSelect,
    orderBy: [{ rollNumber: "asc" }, { student: { displayName: "asc" } }]
  });
}
