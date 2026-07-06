import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import {
  createGuardianSchema,
  linkGuardianSchema,
  updateGuardianSchema,
  updateStudentGuardianLinkSchema
} from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { conflict, displayName, requireBranchPermission, requireTenantPermission } from "./shared";

async function requireGuardianPermission(ctx: TenantContext) {
  if (ctx.activeBranchId) {
    await requireBranchPermission(ctx, "academia.guardian.manage", ctx.activeBranchId);
    return;
  }
  await requireTenantPermission(ctx, "academia.guardian.manage");
}

export async function createGuardian(ctx: TenantContext, input: unknown) {
  const data = createGuardianSchema.parse(input);
  await requireGuardianPermission(ctx);

  return db.$transaction(async (tx) => {
    if (data.phone) {
      const existingPhone = await tx.guardian.findFirst({
        where: { tenantId: ctx.tenantId, phone: data.phone },
        select: { id: true }
      });
      if (existingPhone) throw conflict("GUARDIAN_PHONE_EXISTS");
    }
    if (data.email) {
      const existingEmail = await tx.guardian.findFirst({
        where: { tenantId: ctx.tenantId, email: data.email },
        select: { id: true }
      });
      if (existingEmail) throw conflict("GUARDIAN_EMAIL_EXISTS");
    }

    const guardian = await tx.guardian.create({
      data: {
        ...data,
        tenantId: ctx.tenantId,
        displayName: data.displayName ?? displayName([data.firstName, data.middleName, data.lastName]),
        createdById: ctx.userId
      }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_CREATED,
      entityType: "Guardian",
      entityId: guardian.id,
      after: guardian
    }, tx);
    return guardian;
  });
}

export async function updateGuardian(ctx: TenantContext, input: unknown) {
  const { guardianId, ...data } = updateGuardianSchema.parse(input);
  await requireGuardianPermission(ctx);

  return db.$transaction(async (tx) => {
    const before = await tx.guardian.findFirst({ where: { id: guardianId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("GUARDIAN_NOT_FOUND");

    if (data.phone && data.phone !== before.phone) {
      const duplicate = await tx.guardian.findFirst({
        where: { tenantId: ctx.tenantId, phone: data.phone, id: { not: guardianId } },
        select: { id: true }
      });
      if (duplicate) throw conflict("GUARDIAN_PHONE_EXISTS");
    }
    if (data.email && data.email !== before.email) {
      const duplicate = await tx.guardian.findFirst({
        where: { tenantId: ctx.tenantId, email: data.email, id: { not: guardianId } },
        select: { id: true }
      });
      if (duplicate) throw conflict("GUARDIAN_EMAIL_EXISTS");
    }

    const shouldRefreshDisplayName = !data.displayName && Boolean(data.firstName || data.middleName || data.lastName);
    const after = await tx.guardian.update({
      where: { id: guardianId },
      data: {
        ...data,
        displayName: shouldRefreshDisplayName
          ? displayName([
              data.firstName ?? before.firstName,
              data.middleName ?? before.middleName ?? undefined,
              data.lastName ?? before.lastName ?? undefined
            ])
          : data.displayName,
        updatedById: ctx.userId
      }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_UPDATED,
      entityType: "Guardian",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}

export async function linkGuardianToStudent(ctx: TenantContext, input: unknown) {
  const data = linkGuardianSchema.parse(input);

  return db.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: data.studentId, tenantId: ctx.tenantId },
      select: { id: true, branchId: true }
    });
    if (!student) throw notFound("STUDENT_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.guardian.manage", student.branchId);

    const guardian = await tx.guardian.findFirst({
      where: { id: data.guardianId, tenantId: ctx.tenantId },
      select: { id: true }
    });
    if (!guardian) throw notFound("GUARDIAN_NOT_FOUND");

    const existing = await tx.studentGuardianLink.findFirst({
      where: {
        tenantId: ctx.tenantId,
        studentId: data.studentId,
        guardianId: data.guardianId,
        relation: data.relation
      },
      select: { id: true }
    });
    if (existing) throw conflict("STUDENT_GUARDIAN_LINK_EXISTS");

    const link = await tx.studentGuardianLink.create({
      data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_LINKED,
      entityType: "StudentGuardianLink",
      entityId: link.id,
      branchId: student.branchId,
      after: link
    }, tx);
    return link;
  });
}

export async function updateStudentGuardianLink(ctx: TenantContext, input: unknown) {
  const { studentGuardianLinkId, ...data } = updateStudentGuardianLinkSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.studentGuardianLink.findFirst({
      where: { id: studentGuardianLinkId, tenantId: ctx.tenantId },
      include: { student: { select: { branchId: true } } }
    });
    if (!before) throw notFound("STUDENT_GUARDIAN_LINK_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.guardian.manage", before.student.branchId);

    if (data.relation && data.relation !== before.relation) {
      const duplicate = await tx.studentGuardianLink.findFirst({
        where: {
          tenantId: ctx.tenantId,
          studentId: before.studentId,
          guardianId: before.guardianId,
          relation: data.relation,
          id: { not: studentGuardianLinkId }
        },
        select: { id: true }
      });
      if (duplicate) throw conflict("STUDENT_GUARDIAN_LINK_EXISTS");
    }

    const after = await tx.studentGuardianLink.update({
      where: { id: studentGuardianLinkId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_LINK_UPDATED,
      entityType: "StudentGuardianLink",
      entityId: after.id,
      branchId: before.student.branchId,
      before,
      after
    }, tx);
    return after;
  });
}

export async function unlinkGuardianFromStudent(ctx: TenantContext, studentGuardianLinkId: string) {
  const id = idSchema.parse(studentGuardianLinkId);

  return db.$transaction(async (tx) => {
    const before = await tx.studentGuardianLink.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { student: { select: { branchId: true } } }
    });
    if (!before) throw notFound("STUDENT_GUARDIAN_LINK_NOT_FOUND");
    await requireBranchPermission(ctx, "academia.guardian.manage", before.student.branchId);

    await tx.studentGuardianLink.delete({ where: { id } });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_UNLINKED,
      entityType: "StudentGuardianLink",
      entityId: before.id,
      branchId: before.student.branchId,
      before
    }, tx);
    return before;
  });
}
