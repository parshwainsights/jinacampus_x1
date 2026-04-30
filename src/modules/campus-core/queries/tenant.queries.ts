import { prisma } from "@/core/db/prisma";

export const tenantQueries = {
  findById: (tenantId: string) => prisma.tenant.findUnique({ where: { id: tenantId } }),
  create: (data: { code: string; name: string }) => prisma.tenant.create({ data }),
};
