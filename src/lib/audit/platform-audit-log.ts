import type { Prisma, PrismaClient } from "@prisma/client";

import { db } from "@/lib/db";
import type { PlatformAdministratorContext } from "@/lib/auth/platform-administrator-session";

type DbClient = PrismaClient | Prisma.TransactionClient;

type PlatformAuditInput = {
  ctx: PlatformAdministratorContext;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writePlatformAuditLog(input: PlatformAuditInput, client: DbClient = db) {
  return client.platformAuditLog.create({
    data: {
      actorAdministratorId: input.ctx.administratorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: toJson(input.before),
      afterJson: toJson(input.after),
      metadataJson: toJson(input.metadata),
      ipAddress: input.ctx.ipAddress,
      userAgent: input.ctx.userAgent
    }
  });
}
