import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createClassSchema, updateClassSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { conflict, requireTenantPermission } from "./shared";

export async function createClass(ctx: TenantContext, input: unknown) {
  const data = createClassSchema.parse(input);
  await requireTenantPermission(ctx, "academia.class.manage");

  return db.$transaction(async (tx) => {
    const existing = await tx.class.findFirst({
      where: { tenantId: ctx.tenantId, OR: [{ code: data.code }, { name: data.name }] },
      select: { id: true }
    });
    if (existing) throw conflict("CLASS_ALREADY_EXISTS");

    const academicClass = await tx.class.create({
      data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_CREATED,
      entityType: "Class",
      entityId: academicClass.id,
      after: academicClass
    }, tx);
    return academicClass;
  });
}

export async function updateClass(ctx: TenantContext, input: unknown) {
  const { classId, ...data } = updateClassSchema.parse(input);
  await requireTenantPermission(ctx, "academia.class.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.class.findFirst({ where: { id: classId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("CLASS_NOT_FOUND");

    if (data.code || data.name) {
      const duplicate = await tx.class.findFirst({
        where: {
          tenantId: ctx.tenantId,
          id: { not: classId },
          OR: [{ code: data.code ?? before.code }, { name: data.name ?? before.name }]
        },
        select: { id: true }
      });
      if (duplicate) throw conflict("CLASS_ALREADY_EXISTS");
    }

    const after = await tx.class.update({
      where: { id: classId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_UPDATED,
      entityType: "Class",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}

export async function deactivateClass(ctx: TenantContext, classId: string) {
  const id = idSchema.parse(classId);
  await requireTenantPermission(ctx, "academia.class.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.class.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("CLASS_NOT_FOUND");

    const after = await tx.class.update({
      where: { id },
      data: { status: "INACTIVE", updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.CLASS_DEACTIVATED,
      entityType: "Class",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}
