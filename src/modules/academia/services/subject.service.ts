import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createSubjectSchema, updateSubjectSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { conflict, requireTenantPermission } from "./shared";

export async function createSubject(ctx: TenantContext, input: unknown) {
  const data = createSubjectSchema.parse(input);
  await requireTenantPermission(ctx, "academia.subject.manage");

  return db.$transaction(async (tx) => {
    const existing = await tx.subject.findFirst({
      where: { tenantId: ctx.tenantId, OR: [{ code: data.code }, { name: data.name }] },
      select: { id: true }
    });
    if (existing) throw conflict("SUBJECT_ALREADY_EXISTS");

    const subject = await tx.subject.create({ data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId } });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SUBJECT_CREATED,
      entityType: "Subject",
      entityId: subject.id,
      after: subject
    }, tx);
    return subject;
  });
}

export async function updateSubject(ctx: TenantContext, input: unknown) {
  const { subjectId, ...data } = updateSubjectSchema.parse(input);
  await requireTenantPermission(ctx, "academia.subject.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.subject.findFirst({ where: { id: subjectId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("SUBJECT_NOT_FOUND");

    if (data.code || data.name) {
      const duplicate = await tx.subject.findFirst({
        where: {
          tenantId: ctx.tenantId,
          id: { not: subjectId },
          OR: [{ code: data.code ?? before.code }, { name: data.name ?? before.name }]
        },
        select: { id: true }
      });
      if (duplicate) throw conflict("SUBJECT_ALREADY_EXISTS");
    }

    const after = await tx.subject.update({
      where: { id: subjectId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SUBJECT_UPDATED,
      entityType: "Subject",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}

export async function deactivateSubject(ctx: TenantContext, subjectId: string) {
  const id = idSchema.parse(subjectId);
  await requireTenantPermission(ctx, "academia.subject.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.subject.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("SUBJECT_NOT_FOUND");

    const after = await tx.subject.update({
      where: { id },
      data: { status: "INACTIVE", updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SUBJECT_DEACTIVATED,
      entityType: "Subject",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}
