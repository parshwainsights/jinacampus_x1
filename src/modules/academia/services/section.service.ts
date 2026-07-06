import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import { createSectionSchema, updateSectionSchema } from "@/modules/academia/schemas";
import { idSchema } from "@/modules/academia/schemas/shared";
import { conflict, requireTenantPermission } from "./shared";

export async function createSection(ctx: TenantContext, input: unknown) {
  const data = createSectionSchema.parse(input);
  await requireTenantPermission(ctx, "academia.section.manage");

  return db.$transaction(async (tx) => {
    const existing = await tx.section.findFirst({
      where: { tenantId: ctx.tenantId, OR: [{ code: data.code }, { name: data.name }] },
      select: { id: true }
    });
    if (existing) throw conflict("SECTION_ALREADY_EXISTS");

    const section = await tx.section.create({ data: { ...data, tenantId: ctx.tenantId, createdById: ctx.userId } });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SECTION_CREATED,
      entityType: "Section",
      entityId: section.id,
      after: section
    }, tx);
    return section;
  });
}

export async function updateSection(ctx: TenantContext, input: unknown) {
  const { sectionId, ...data } = updateSectionSchema.parse(input);
  await requireTenantPermission(ctx, "academia.section.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.section.findFirst({ where: { id: sectionId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("SECTION_NOT_FOUND");

    if (data.code || data.name) {
      const duplicate = await tx.section.findFirst({
        where: {
          tenantId: ctx.tenantId,
          id: { not: sectionId },
          OR: [{ code: data.code ?? before.code }, { name: data.name ?? before.name }]
        },
        select: { id: true }
      });
      if (duplicate) throw conflict("SECTION_ALREADY_EXISTS");
    }

    const after = await tx.section.update({
      where: { id: sectionId },
      data: { ...data, updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SECTION_UPDATED,
      entityType: "Section",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}

export async function deactivateSection(ctx: TenantContext, sectionId: string) {
  const id = idSchema.parse(sectionId);
  await requireTenantPermission(ctx, "academia.section.manage");

  return db.$transaction(async (tx) => {
    const before = await tx.section.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("SECTION_NOT_FOUND");

    const after = await tx.section.update({
      where: { id },
      data: { status: "INACTIVE", updatedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.SECTION_DEACTIVATED,
      entityType: "Section",
      entityId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}
