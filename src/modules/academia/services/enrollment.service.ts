import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createEnrollmentSchema, updateEnrollmentSchema } from "@/modules/academia/schemas";
import { enrollmentStatusSchema, idSchema } from "@/modules/academia/schemas/shared";
import {
  type AcademiaDbClient,
  conflict,
  ensureAcademicYear,
  ensureActiveBranch,
  requireBranchPermission,
  validationError
} from "./shared";

async function ensureActiveStudent(tx: AcademiaDbClient, ctx: TenantContext, studentId: string, branchId: string) {
  const student = await tx.student.findFirst({
    where: { id: studentId, tenantId: ctx.tenantId, branchId, status: "ACTIVE" },
    select: { id: true }
  });
  if (!student) throw notFound("ACTIVE_STUDENT_NOT_FOUND");
  return student;
}

async function ensureActiveClassSection(
  tx: AcademiaDbClient,
  ctx: TenantContext,
  classSectionId: string,
  branchId: string,
  academicYearId: string
) {
  const classSection = await tx.classSection.findFirst({
    where: {
      id: classSectionId,
      tenantId: ctx.tenantId,
      branchId,
      academicYearId,
      status: "ACTIVE"
    },
    select: { id: true, branchId: true, academicYearId: true }
  });
  if (!classSection) throw notFound("CLASS_SECTION_NOT_FOUND");
  return classSection;
}

export async function createEnrollment(ctx: TenantContext, input: unknown) {
  const data = createEnrollmentSchema.parse(input);
  await requireBranchPermission(ctx, "academia.enrollment.manage", data.branchId);

  return db.$transaction(async (tx) => {
    await ensureActiveBranch(tx, ctx, data.branchId);
    await ensureAcademicYear(tx, ctx, data.academicYearId);
    await ensureActiveStudent(tx, ctx, data.studentId, data.branchId);
    await ensureActiveClassSection(tx, ctx, data.classSectionId, data.branchId, data.academicYearId);

    const existingEnrollment = await tx.enrollment.findFirst({
      where: { tenantId: ctx.tenantId, academicYearId: data.academicYearId, studentId: data.studentId },
      select: { id: true, status: true }
    });
    if (existingEnrollment) throw conflict("ENROLLMENT_ALREADY_EXISTS_FOR_ACADEMIC_YEAR");

    if (data.rollNumber) {
      const existingRollNumber = await tx.enrollment.findFirst({
        where: {
          tenantId: ctx.tenantId,
          academicYearId: data.academicYearId,
          classSectionId: data.classSectionId,
          rollNumber: data.rollNumber
        },
        select: { id: true }
      });
      if (existingRollNumber) throw conflict("ROLL_NUMBER_ALREADY_EXISTS");
    }

    const enrollment = await tx.enrollment.create({
      data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.ENROLLMENT_CREATED,
      entityType: "Enrollment",
      entityId: enrollment.id,
      branchId: enrollment.branchId,
      academicYearId: enrollment.academicYearId,
      after: enrollment
    }, tx);
    return enrollment;
  });
}

export async function updateEnrollment(ctx: TenantContext, input: unknown) {
  const { enrollmentId, ...data } = updateEnrollmentSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.enrollment.findFirst({ where: { id: enrollmentId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("ENROLLMENT_NOT_FOUND");

    await requireBranchPermission(ctx, "academia.enrollment.manage", before.branchId);
    const nextBranchId = data.branchId ?? before.branchId;
    const nextAcademicYearId = data.academicYearId ?? before.academicYearId;
    const nextClassSectionId = data.classSectionId ?? before.classSectionId;

    if ((data.branchId || data.academicYearId) && !data.classSectionId) {
      throw validationError("CLASS_SECTION_REQUIRED_FOR_ENROLLMENT_SCOPE_CHANGE");
    }
    if (nextBranchId !== before.branchId) {
      await requireBranchPermission(ctx, "academia.enrollment.manage", nextBranchId);
      await ensureActiveBranch(tx, ctx, nextBranchId);
    }
    if (nextAcademicYearId !== before.academicYearId) {
      await ensureAcademicYear(tx, ctx, nextAcademicYearId);
    }
    if (data.classSectionId || data.branchId || data.academicYearId) {
      await ensureActiveClassSection(tx, ctx, nextClassSectionId, nextBranchId, nextAcademicYearId);
      await ensureActiveStudent(tx, ctx, before.studentId, nextBranchId);
    }

    const nextRollNumber = data.rollNumber ?? before.rollNumber ?? undefined;
    if (nextRollNumber && (data.rollNumber || data.classSectionId || data.academicYearId)) {
      const duplicateRollNumber = await tx.enrollment.findFirst({
        where: {
          tenantId: ctx.tenantId,
          academicYearId: nextAcademicYearId,
          classSectionId: nextClassSectionId,
          rollNumber: nextRollNumber,
          id: { not: enrollmentId }
        },
        select: { id: true }
      });
      if (duplicateRollNumber) throw conflict("ROLL_NUMBER_ALREADY_EXISTS");
    }

    const after = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action:
        data.status && data.status !== before.status
          ? ACADEMIA_AUDIT_EVENTS.ENROLLMENT_STATUS_CHANGED
          : ACADEMIA_AUDIT_EVENTS.ENROLLMENT_UPDATED,
      entityType: "Enrollment",
      entityId: after.id,
      branchId: after.branchId,
      academicYearId: after.academicYearId,
      before,
      after
    }, tx);
    return after;
  });
}

export async function updateEnrollmentStatus(ctx: TenantContext, enrollmentId: string, status: unknown) {
  const id = idSchema.parse(enrollmentId);
  const nextStatus = enrollmentStatusSchema.parse(status);

  return db.$transaction(async (tx) => {
    const before = await tx.enrollment.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("ENROLLMENT_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.enrollment.manage", before.branchId);

    const after = await tx.enrollment.update({
      where: { id },
      data: { status: nextStatus, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action:
        nextStatus === "CANCELLED"
          ? ACADEMIA_AUDIT_EVENTS.ENROLLMENT_CANCELLED
          : ACADEMIA_AUDIT_EVENTS.ENROLLMENT_STATUS_CHANGED,
      entityType: "Enrollment",
      entityId: after.id,
      branchId: after.branchId,
      academicYearId: after.academicYearId,
      before,
      after
    }, tx);
    return after;
  });
}

export async function cancelEnrollment(ctx: TenantContext, enrollmentId: string) {
  return updateEnrollmentStatus(ctx, enrollmentId, "CANCELLED");
}
