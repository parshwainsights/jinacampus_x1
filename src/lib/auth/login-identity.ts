import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const loginUserInclude = {
  passwordCredential: true,
  roleAssignments: {
    where: { isActive: true },
    select: {
      tenantId: true,
      startsAt: true,
      endsAt: true,
      role: { select: { tenantId: true, code: true, isActive: true } }
    }
  }
} satisfies Prisma.UserInclude;

export type LoginUser = Prisma.UserGetPayload<{ include: typeof loginUserInclude }>;

export function normalizeLoginIdentifier(value: string) {
  const normalized = value.trim();
  return normalized.includes("@") ? normalized.toLowerCase() : normalized.toUpperCase();
}

export function activeRoleCodes(user: LoginUser, now = new Date()) {
  return Array.from(new Set(
    user.roleAssignments
      .filter((assignment) => (
        assignment.tenantId === user.tenantId &&
        assignment.role.tenantId === user.tenantId &&
        assignment.role.isActive &&
        (!assignment.startsAt || assignment.startsAt <= now) &&
        (!assignment.endsAt || assignment.endsAt > now)
      ))
      .map((assignment) => assignment.role.code)
  ));
}

export async function findLoginUser(
  client: DbClient,
  tenantId: string,
  identifier: string
): Promise<{ user: LoginUser; identifierType: "EMAIL" | "EMPLOYEE_CODE" } | null> {
  const normalized = normalizeLoginIdentifier(identifier);
  if (normalized.includes("@")) {
    const user = await client.user.findUnique({
      where: { tenantId_email: { tenantId, email: normalized } },
      include: loginUserInclude
    });
    return user?.status === "ACTIVE" ? { user, identifierType: "EMAIL" } : null;
  }

  const staffProfile = await client.staffProfile.findFirst({
    where: {
      tenantId,
      employeeCode: { equals: normalized, mode: "insensitive" },
      employmentStatus: "ACTIVE",
      userId: { not: null }
    },
    select: {
      user: { include: loginUserInclude }
    }
  });
  const user = staffProfile?.user;
  return user?.status === "ACTIVE" ? { user, identifierType: "EMPLOYEE_CODE" } : null;
}
