import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ROLE_PERMISSION_MAP,
  SCHOOL_OPERATIONAL_ROLE_CODES,
  type SchoolOperationalRoleCode
} from "../../src/lib/rbac/roles";

type DbClient = PrismaClient | Prisma.TransactionClient;

const ROLE_DISPLAY_NAMES: Record<SchoolOperationalRoleCode, string> = {
  PRINCIPAL: "Principal",
  OFFICE_STAFF: "Office Operator",
  TEACHER: "Teacher",
  STAFF: "Staff"
};

export async function seedDefaultRolesForTenant(db: DbClient, tenantId: string) {
  for (const roleCode of SCHOOL_OPERATIONAL_ROLE_CODES) {
    const name = ROLE_DISPLAY_NAMES[roleCode] ?? roleCode.replaceAll("_", " ");
    const role = await db.role.upsert({
      where: { tenantId_code: { tenantId, code: roleCode } },
      create: {
        tenantId,
        code: roleCode,
        name,
        isSystem: true,
        isMutable: false
      },
      update: {
        name,
        isSystem: true,
        isMutable: false,
        isActive: true
      }
    });

    for (const permissionCode of ROLE_PERMISSION_MAP[roleCode]) {
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
