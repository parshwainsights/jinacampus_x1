import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createClassSectionSchema, updateClassSectionSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import {
  conflict,
  ensureAcademicYear,
  ensureActiveBranch,
  ensureActiveClass,
  ensureActiveSection,
  ensureClassTeacherAccess,
  requireBranchPermission
} from "./shared";

export async function createClassSection(ctx: TenantContext, input: unknown) {
  const data = createClassSectionSchema.parse(input);
  await requireBranchPermission(ctx, "academia.class.manage", data.branchId);

  return db.$transaction(async (tx) => {
    await ensureActiveBranch(tx, ctx, data.branchId);
    await ensureAcademicYear(tx, ctx, data.academicYearId);
    await ensureActiveClass(tx, ctx, data.classId);
    await ensureActiveSection(tx, ctx, data.sectionId);
    await ensureClassTeacherAccess(tx, ctx, data.classTeacherUserId, data.branchId);

    const existing = await tx.classSection.findFirst({
      where: {
        tenantId: ctx.tenantId,
        branchId: data.branchId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId
      },
      select: { id: true }
    });
    if (existing) throw conflict("CLASS_SECTION_ALREADY_EXISTS");

    const classSection = await tx.classSection.create({
      data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_SECTION_CREATED,
      entityType: "ClassSection",
      entityId: classSection.id,
      branchId: classSection.branchId,
      academicYearId: classSection.academicYearId,
      after: classSection
    }, tx);
    return classSection;
  });
}

export async function updateClassSection(ctx: TenantContext, input: unknown) {
  const { classSectionId, ...data } = updateClassSectionSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.classSection.findFirst({ where: { id: classSectionId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("CLASS_SECTION_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.class.manage", before.branchId);

    const nextClassId = data.classId ?? before.classId;
    const nextSectionId = data.sectionId ?? before.sectionId;
    if (data.classId) await ensureActiveClass(tx, ctx, data.classId);
    if (data.sectionId) await ensureActiveSection(tx, ctx, data.sectionId);
    await ensureClassTeacherAccess(tx, ctx, data.classTeacherUserId, before.branchId);

    if (data.classId || data.sectionId) {
      const duplicate = await tx.classSection.findFirst({
        where: {
          tenantId: ctx.tenantId,
          branchId: before.branchId,
          academicYearId: before.academicYearId,
          classId: nextClassId,
          sectionId: nextSectionId,
          id: { not: classSectionId }
        },
        select: { id: true }
      });
      if (duplicate) throw conflict("CLASS_SECTION_ALREADY_EXISTS");
    }

    const after = await tx.classSection.update({
      where: { id: classSectionId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_SECTION_UPDATED,
      entityType: "ClassSection",
      entityId: after.id,
      branchId: after.branchId,
      academicYearId: after.academicYearId,
      before,
      after
    }, tx);
    return after;
  });
}

export async function deactivateClassSection(ctx: TenantContext, classSectionId: string) {
  const id = idSchema.parse(classSectionId);

  return db.$transaction(async (tx) => {
    const before = await tx.classSection.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("CLASS_SECTION_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.class.manage", before.branchId);

    const after = await tx.classSection.update({
      where: { id },
      data: { status: "INACTIVE", updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_SECTION_DEACTIVATED,
      entityType: "ClassSection",
      entityId: after.id,
      branchId: after.branchId,
      academicYearId: after.academicYearId,
      before,
      after
    }, tx);
    return after;
  });
}
