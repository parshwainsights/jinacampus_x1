import type { Prisma, PrismaClient } from "@prisma/client";
import { DEFAULT_ROLE_CODES, DEFAULT_ROLE_PERMISSION_MAP } from "../../src/lib/rbac/roles";

type DbClient = PrismaClient | Prisma.TransactionClient;

const ROLE_DISPLAY_NAMES: Partial<Record<(typeof DEFAULT_ROLE_CODES)[number], string>> = {
  TENANT_OWNER: "Tenant Owner",
  SUPER_ADMIN: "Super Admin",
  ADMINISTRATOR: "Administrator",
  ADMIN: "Super Admin",
  PRINCIPAL: "Principal",
  OFFICE_STAFF: "Office Staff",
  CLASS_TEACHER: "Class Teacher",
  TEACHER: "Teacher",
  STAFF: "Staff",
  PARENT: "Parent",
  STUDENT: "Student"
};

export async function seedDefaultRolesForTenant(db: DbClient, tenantId: string) {
  for (const roleCode of DEFAULT_ROLE_CODES) {
    const name = ROLE_DISPLAY_NAMES[roleCode] ?? roleCode.replaceAll("_", " ");
    const role = await db.role.upsert({
      where: { tenantId_code: { tenantId, code: roleCode } },
      create: {
        tenantId,
        code: roleCode,
        name,
        isSystem: true,
        isMutable: roleCode !== "TENANT_OWNER"
      },
      update: {
        name,
        isSystem: true,
        isMutable: roleCode !== "TENANT_OWNER",
        isActive: true
      }
    });

    for (const permissionCode of DEFAULT_ROLE_PERMISSION_MAP[roleCode]) {
      const permission = await db.permission.findUnique({ where: { code: permissionCode } });
      if (!permission) continue;
      await db.rolePermission.upsert({
        where: { tenantId_roleId_permissionId: { tenantId, roleId: role.id, permissionId: permission.id } },
        create: { tenantId, roleId: role.id, permissionId: permission.id },
        update: {}
      });
    }
  }
}
