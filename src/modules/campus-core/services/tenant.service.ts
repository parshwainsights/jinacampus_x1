import { logAuditEvent } from "@/core/audit/logger";
import { requirePermission } from "@/core/rbac/guard";
import { createTenantSchema } from "@/modules/campus-core/schemas";
import { tenantQueries } from "@/modules/campus-core/queries/tenant.queries";
import { AUDIT_EVENTS } from "@/modules/campus-core/constants/audit-events";

export async function createTenantService(input: {
  actorUserId: string;
  tenantId: string;
  payload: unknown;
}) {
  await requirePermission({
    userId: input.actorUserId,
    tenantId: input.tenantId,
    permission: "campuscore.institution.manage",
  });

  const data = createTenantSchema.parse(input.payload);
  const tenant = await tenantQueries.create(data);

  await logAuditEvent({
    tenantId: tenant.id,
    actorUserId: input.actorUserId,
    action: AUDIT_EVENTS.TENANT_CREATED,
    entityType: "Tenant",
    entityId: tenant.id,
    afterJson: tenant,
  });

  return tenant;
}
