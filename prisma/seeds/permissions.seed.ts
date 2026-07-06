import type { PrismaClient } from "@prisma/client";
import { PERMISSION_DEFINITIONS } from "../../src/lib/rbac/permissions";

export async function seedPermissions(db: PrismaClient) {
  for (const permission of PERMISSION_DEFINITIONS) {
    await db.permission.upsert({
      where: { code: permission.code },
      create: {
        code: permission.code,
        module: permission.module,
        description: permission.description
      },
      update: {
        module: permission.module,
        description: permission.description,
        isActive: true
      }
    });
  }
}
