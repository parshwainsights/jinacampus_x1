import { prisma } from "@/core/db/prisma";
import { forbidden } from "@/core/errors/http";

export async function requirePermission(input: {
  userId: string;
  tenantId: string;
  permission: string;
  branchId?: string | null;
}) {
  const { userId, tenantId, permission, branchId } = input;

  if (branchId) {
    const access = await prisma.userBranchAccess.findFirst({ where: { tenantId, userId, branchId } });
    if (!access) throw forbidden("No branch access");
  }

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { tenantId, userId, OR: [{ branchId: null }, { branchId }] },
    select: { roleId: true },
  });

  const roleIds = assignments.map((x) => x.roleId);
  if (roleIds.length === 0) throw forbidden("No roles assigned");

  const hasPermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: { in: roleIds },
      permissionId: { in: (await prisma.permission.findMany({ where: { key: permission }, select: { id: true } })).map((p) => p.id) },
    },
  });

  if (!hasPermission) throw forbidden(`Missing permission: ${permission}`);
}
