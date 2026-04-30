import { prisma } from "@/core/db/prisma";

export async function logAuditEvent(input: {
  tenantId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  branchId?: string;
  academicYearId?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadataJson?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({ data: input });
}
