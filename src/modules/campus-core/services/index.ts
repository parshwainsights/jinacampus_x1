import type { z } from "zod";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import type { TenantContext } from "@/lib/tenant/context";
import { getEffectivePermissions, requirePermission } from "@/lib/rbac/require-permission";
import { canAssignRole, hasPlatformAdminRole, isPlatformAdminRoleCode } from "@/lib/rbac/roles";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import type {
  activateAcademicYearSchema,
  adminResetPasswordSchema,
  assignUserBranchSchema,
  assignUserRoleSchema,
  changeOwnPasswordSchema,
  createAcademicYearSchema,
  createBranchSchema,
  createInstitutionSchema,
  createRoleSchema,
  createUserSchema,
  deactivateUserSchema,
  forgotPasswordSchema,
  removeUserBranchSchema,
  removeUserRoleSchema,
  updateAttendanceSettingsSchema,
  updateBranchSchema,
  updateInstitutionSchema,
  updateTenantSettingsSchema,
  updateUserSchema
} from "@/modules/campus-core/schemas";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function userDisplayName(input: { firstName?: string | null; lastName?: string | null }) {
  return [input.firstName, input.lastName].filter(Boolean).join(" ");
}

function sanitizeUserForAudit<T extends object>(user: T) {
  const { passwordCredential: _passwordCredential, ...safeUser } = user as Record<string, unknown>;
  return safeUser;
}

function passwordMetadata(targetUserId: string) {
  return { targetUserId, passwordUpdated: true };
}

type PasswordRecoveryRequestOptions = {
  ipAddress?: string;
  userAgent?: string;
};

function tenantRoleScope(input: { scopeType?: "TENANT" | "BRANCH" | "ACADEMIC_YEAR"; scopeId?: string }) {
  return {
    scopeType: input.scopeType ?? "TENANT",
    scopeId: input.scopeId ?? "TENANT"
  };
}

function isPlatformAdminContext(ctx: TenantContext) {
  return hasPlatformAdminRole(ctx.roleCodes ?? []);
}

function targetUserGovernanceWhere(ctx: TenantContext, userId: string) {
  const base = {
    id: userId,
    tenantId: ctx.tenantId,
    status: { not: "DEACTIVATED" as const }
  };
  if (isPlatformAdminContext(ctx)) return base;

  return {
    ...base,
    OR: [
      { id: ctx.userId },
      { createdById: ctx.userId },
      {
        branchAccesses: {
          some: {
            tenantId: ctx.tenantId,
            isActive: true,
            branchId: { in: ctx.accessibleBranchIds }
          }
        }
      }
    ]
  };
}

function assertRoleAssignable(ctx: TenantContext, roleCode: string) {
  if (!canAssignRole(ctx.roleCodes ?? [], roleCode)) {
    throw new AppError("ROLE_ASSIGNMENT_NOT_ALLOWED", "ROLE_ASSIGNMENT_NOT_ALLOWED", 403);
  }
}

async function hashAccountPassword(password: string) {
  const { hashPassword } = await import("@/lib/auth/password");
  return hashPassword(password);
}

async function verifyAccountPassword(password: string, storedHash: string) {
  const { verifyPassword } = await import("@/lib/auth/password");
  return verifyPassword(password, storedHash);
}

type UserLifecycleDbClient = Pick<typeof db, "userRoleAssignment">;

async function assertCanDeactivateTargetUser(
  tx: UserLifecycleDbClient,
  ctx: TenantContext,
  targetUser: { id: string; tenantId: string; status: string }
) {
  if (targetUser.id === ctx.userId) {
    throw new AppError("USER_SELF_DEACTIVATE_BLOCKED", "USER_SELF_DEACTIVATE_BLOCKED", 400);
  }
  if (targetUser.tenantId !== ctx.tenantId) {
    throw notFound("USER_NOT_FOUND");
  }
  if (targetUser.status === "DEACTIVATED") {
    throw new AppError("USER_ALREADY_DEACTIVATED", "USER_ALREADY_DEACTIVATED", 409);
  }

  const roleAssignments = await tx.userRoleAssignment.findMany({
    where: {
      tenantId: ctx.tenantId,
      userId: targetUser.id,
      isActive: true
    },
    select: {
      role: { select: { code: true } }
    }
  });
  const targetHasPlatformAdminRole = roleAssignments.some((assignment) => isPlatformAdminRoleCode(assignment.role.code));
  if (targetHasPlatformAdminRole && !isPlatformAdminContext(ctx)) {
    throw new AppError("USER_PLATFORM_ADMIN_DEACTIVATE_FORBIDDEN", "USER_PLATFORM_ADMIN_DEACTIVATE_FORBIDDEN", 403);
  }
}

export async function createInstitutionService(ctx: TenantContext, input: z.infer<typeof createInstitutionSchema>) {
  await requirePermission({ ctx, permission: "campuscore.institution.manage" });
  return db.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        displayName: input.displayName,
        code: input.code,
        board: input.board,
        medium: input.medium,
        logoUrl: input.logoUrl,
        logoObjectKey: input.logoObjectKey,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        createdById: ctx.userId
      }
    });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.INSTITUTION_CREATED, entityType: "Institution", entityId: institution.id, after: institution }, tx);
    return institution;
  });
}

export async function updateInstitutionService(ctx: TenantContext, input: z.infer<typeof updateInstitutionSchema>) {
  await requirePermission({ ctx, permission: "campuscore.institution.manage" });
  return db.$transaction(async (tx) => {
    const { institutionId } = input;
    const before = await tx.institution.findFirst({
      where: { id: institutionId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } }
    });
    if (!before) throw notFound("INSTITUTION_NOT_FOUND");

    const after = await tx.institution.update({
      where: { id: institutionId },
      data: {
        name: input.name,
        displayName: input.displayName,
        code: input.code,
        status: input.status,
        board: input.board,
        medium: input.medium,
        logoUrl: input.logoUrl,
        logoObjectKey: input.logoObjectKey,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        updatedById: ctx.userId
      }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.INSTITUTION_UPDATED,
      entityType: "Institution",
      entityId: after.id,
      before,
      after
    }, tx);
    const brandingChanged = (
      (input.displayName !== undefined && input.displayName !== before.displayName) ||
      (input.logoUrl !== undefined && input.logoUrl !== before.logoUrl) ||
      (input.logoObjectKey !== undefined && input.logoObjectKey !== before.logoObjectKey)
    );
    if (brandingChanged) {
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.INSTITUTION_BRANDING_UPDATED,
        entityType: "Institution",
        entityId: after.id,
        before: {
          displayName: before.displayName,
          logoUrl: before.logoUrl,
          logoObjectKey: before.logoObjectKey
        },
        after: {
          displayName: after.displayName,
          logoUrl: after.logoUrl,
          logoObjectKey: after.logoObjectKey
        }
      }, tx);
    }
    return after;
  });
}

export async function createBranchService(ctx: TenantContext, input: z.infer<typeof createBranchSchema>) {
  await requirePermission({ ctx, permission: "campuscore.branch.manage" });
  return db.$transaction(async (tx) => {
    const institution = await tx.institution.findFirst({ where: { id: input.institutionId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } } });
    if (!institution) throw new Error("INSTITUTION_NOT_FOUND");

    const branch = await tx.branch.create({
      data: {
        tenantId: ctx.tenantId,
        institutionId: input.institutionId,
        name: input.name,
        code: input.code,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        email: input.email,
        timezone: input.timezone,
        createdById: ctx.userId
      }
    });
    await tx.attendanceSetting.create({ data: { tenantId: ctx.tenantId, branchId: branch.id, createdById: ctx.userId } });
    await tx.userBranchAccess.upsert({
      where: { tenantId_userId_branchId: { tenantId: ctx.tenantId, userId: ctx.userId, branchId: branch.id } },
      create: { tenantId: ctx.tenantId, userId: ctx.userId, branchId: branch.id, grantedById: ctx.userId },
      update: { isActive: true }
    });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.BRANCH_CREATED, entityType: "Branch", entityId: branch.id, branchId: branch.id, after: branch }, tx);
    return branch;
  });
}

export async function updateBranchService(ctx: TenantContext, input: z.infer<typeof updateBranchSchema>) {
  await requirePermission({ ctx, permission: "campuscore.branch.manage", branchId: input.branchId });
  return db.$transaction(async (tx) => {
    const { branchId, institutionId } = input;
    if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(branchId)) throw new Error("FORBIDDEN_BRANCH_ACCESS");

    const before = await tx.branch.findFirst({
      where: { id: branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } }
    });
    if (!before) throw notFound("BRANCH_NOT_FOUND");

    if (institutionId) {
      const institution = await tx.institution.findFirst({
        where: { id: institutionId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (!institution) throw notFound("INSTITUTION_NOT_FOUND");
    }

    const after = await tx.branch.update({
      where: { id: branchId },
      data: {
        institutionId,
        name: input.name,
        code: input.code,
        status: input.status,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        email: input.email,
        timezone: input.timezone,
        updatedById: ctx.userId
      }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.BRANCH_UPDATED,
      entityType: "Branch",
      entityId: after.id,
      branchId: after.id,
      before,
      after
    }, tx);
    return after;
  });
}

export async function createAcademicYearService(ctx: TenantContext, input: z.infer<typeof createAcademicYearSchema>) {
  await requirePermission({ ctx, permission: "campuscore.academic_year.manage" });
  return db.$transaction(async (tx) => {
    const institution = await tx.institution.findFirst({
      where: { id: input.institutionId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } }
    });
    if (!institution) throw new Error("INSTITUTION_NOT_FOUND");

    const year = await tx.academicYear.create({ data: { ...input, tenantId: ctx.tenantId, createdById: ctx.userId } });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.ACADEMIC_YEAR_CREATED, entityType: "AcademicYear", entityId: year.id, academicYearId: year.id, after: year }, tx);
    return year;
  });
}

export async function activateAcademicYearService(ctx: TenantContext, input: z.infer<typeof activateAcademicYearSchema>) {
  await requirePermission({ ctx, permission: "campuscore.academic_year.manage" });
  return db.$transaction(async (tx) => {
    const target = await tx.academicYear.findFirst({ where: { id: input.academicYearId, tenantId: ctx.tenantId } });
    if (!target) throw new Error("ACADEMIC_YEAR_NOT_FOUND");

    const settings = await tx.tenantSettings.findUnique({ where: { tenantId: ctx.tenantId } });
    if (!settings?.allowMultipleActiveAcademicYears) {
      await tx.academicYear.updateMany({
        where: { tenantId: ctx.tenantId, institutionId: target.institutionId, id: { not: target.id } },
        data: { isActive: false, status: "LOCKED", updatedById: ctx.userId }
      });
    }

    const after = await tx.academicYear.update({
      where: { id: target.id },
      data: { isActive: true, status: "ACTIVE", updatedById: ctx.userId }
    });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.ACADEMIC_YEAR_ACTIVATED, entityType: "AcademicYear", entityId: after.id, academicYearId: after.id, before: target, after }, tx);
    return after;
  });
}

export async function createUserService(ctx: TenantContext, input: z.infer<typeof createUserSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.create" });
  if (input.branchIds.length) await requirePermission({ ctx, permission: "campuscore.user.update" });
  if (input.roleCodes.length) await requirePermission({ ctx, permission: "campuscore.user.manage" });

  return db.$transaction(async (tx) => {
    const branchIds = unique(input.branchIds);
    const roleCodes = unique(input.roleCodes);

    if (!isPlatformAdminContext(ctx) && branchIds.length === 0) {
      throw new AppError("USER_BRANCH_ACCESS_REQUIRED", "USER_BRANCH_ACCESS_REQUIRED", 400);
    }

    for (const branchId of branchIds) {
      if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(branchId)) throw new Error("FORBIDDEN_BRANCH_ACCESS");
    }

    if (branchIds.length) {
      const branchCount = await tx.branch.count({
        where: { tenantId: ctx.tenantId, id: { in: branchIds }, status: { not: "ARCHIVED" } }
      });
      if (branchCount !== branchIds.length) throw new Error("BRANCH_NOT_FOUND");
    }

    const roles = roleCodes.length
      ? await tx.role.findMany({ where: { tenantId: ctx.tenantId, code: { in: roleCodes }, isActive: true } })
      : [];
    if (roles.length !== roleCodes.length) throw new Error("ROLE_NOT_FOUND");
    for (const role of roles) assertRoleAssignable(ctx, role.code);
    const passwordHash = input.initialPassword ? await hashAccountPassword(input.initialPassword) : null;

    const user = await tx.user.create({
      data: {
        tenantId: ctx.tenantId,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        displayName: userDisplayName(input),
        userType: input.userType,
        status: passwordHash ? "ACTIVE" : "INVITED",
        invitedAt: passwordHash ? undefined : new Date(),
        activatedAt: passwordHash ? new Date() : undefined,
        createdById: ctx.userId
      }
    });

    if (passwordHash) {
      await tx.passwordCredential.create({
        data: { userId: user.id, passwordHash, mustChange: true }
      });
    }

    for (const branchId of branchIds) {
      await tx.userBranchAccess.create({ data: { tenantId: ctx.tenantId, userId: user.id, branchId, grantedById: ctx.userId } });
    }

    for (const role of roles) {
      await tx.userRoleAssignment.create({ data: { tenantId: ctx.tenantId, userId: user.id, roleId: role.id, assignedById: ctx.userId } });
    }

    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_CREATED,
      entityType: "User",
      entityId: user.id,
      after: sanitizeUserForAudit(user),
      metadata: { initialPasswordSet: Boolean(passwordHash) }
    }, tx);
    return user;
  });
}

export async function updateUserService(ctx: TenantContext, input: z.infer<typeof updateUserSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.update" });
  return db.$transaction(async (tx) => {
    const { userId } = input;
    const before = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, userId)
    });
    if (!before) throw notFound("USER_NOT_FOUND");
    const restrictedLifecycleStatusChange = Boolean(
      input.status &&
      input.status !== before.status &&
      ["SUSPENDED", "DEACTIVATED"].includes(input.status)
    );
    if (restrictedLifecycleStatusChange) {
      await requirePermission({ ctx, permission: "campuscore.user.deactivate" });
      await assertCanDeactivateTargetUser(tx, ctx, before);
    }

    const after = await tx.user.update({
      where: { id: userId },
      data: {
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        userType: input.userType,
        status: input.status,
        deactivatedAt: input.status === "DEACTIVATED" ? new Date() : undefined,
        displayName: input.firstName || input.lastName
          ? userDisplayName({
            firstName: input.firstName ?? before.firstName,
            lastName: input.lastName ?? before.lastName
          })
          : undefined,
        updatedById: ctx.userId
      }
    });
    if (input.status === "DEACTIVATED" && input.status !== before.status) {
      await tx.session.updateMany({
        where: { tenantId: ctx.tenantId, userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    await writeAuditLog({
      ctx,
      action: input.status === "DEACTIVATED" && input.status !== before.status
        ? CAMPUS_CORE_AUDIT_EVENTS.USER_DEACTIVATED
        : CAMPUS_CORE_AUDIT_EVENTS.USER_UPDATED,
      entityType: "User",
      entityId: after.id,
      before: sanitizeUserForAudit(before),
      after: sanitizeUserForAudit(after),
      metadata: input.status === "DEACTIVATED" && input.status !== before.status
        ? { sessionsRevoked: true }
        : undefined
    }, tx);
    return after;
  });
}

export async function deactivateUserService(ctx: TenantContext, input: z.infer<typeof deactivateUserSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.deactivate" });
  return db.$transaction(async (tx) => {
    const { userId } = input;
    const before = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, userId)
    });
    if (!before) throw notFound("USER_NOT_FOUND");
    await assertCanDeactivateTargetUser(tx, ctx, before);

    const after = await tx.user.update({
      where: { id: userId },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
        updatedById: ctx.userId
      }
    });
    await tx.session.updateMany({
      where: { tenantId: ctx.tenantId, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_DEACTIVATED,
      entityType: "User",
      entityId: after.id,
      before: sanitizeUserForAudit(before),
      after: sanitizeUserForAudit(after),
      metadata: { sessionsRevoked: true }
    }, tx);
    return after;
  });
}

export async function assignUserRoleService(ctx: TenantContext, input: z.infer<typeof assignUserRoleSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.manage" });
  return db.$transaction(async (tx) => {
    const scope = tenantRoleScope(input);
    if (scope.scopeType === "BRANCH") {
      if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(scope.scopeId)) throw new AppError("FORBIDDEN_BRANCH_ACCESS", "FORBIDDEN_BRANCH_ACCESS", 403);
      const branch = await tx.branch.findFirst({
        where: { id: scope.scopeId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (!branch) throw notFound("BRANCH_NOT_FOUND");
    }
    if (scope.scopeType === "ACADEMIC_YEAR") {
      const academicYear = await tx.academicYear.findFirst({
        where: { id: scope.scopeId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (!academicYear) throw notFound("ACADEMIC_YEAR_NOT_FOUND");
    }

    const user = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, input.userId),
      select: { id: true, email: true }
    });
    if (!user) throw notFound("USER_NOT_FOUND");

    const role = await tx.role.findFirst({
      where: { id: input.roleId, tenantId: ctx.tenantId, isActive: true },
      select: { id: true, code: true, name: true }
    });
    if (!role) throw notFound("ROLE_NOT_FOUND");
    assertRoleAssignable(ctx, role.code);

    const uniqueWhere = {
      tenantId: ctx.tenantId,
      userId: user.id,
      roleId: role.id,
      scopeType: scope.scopeType,
      scopeId: scope.scopeId
    };
    const before = await tx.userRoleAssignment.findUnique({
      where: { tenantId_userId_roleId_scopeType_scopeId: uniqueWhere }
    });
    if (before?.isActive) throw new AppError("USER_ROLE_ALREADY_ASSIGNED", "USER_ROLE_ALREADY_ASSIGNED", 409);

    const after = before
      ? await tx.userRoleAssignment.update({
        where: { id: before.id },
        data: {
          assignedById: ctx.userId,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          isActive: true
        }
      })
      : await tx.userRoleAssignment.create({
        data: {
          ...uniqueWhere,
          assignedById: ctx.userId,
          startsAt: input.startsAt,
          endsAt: input.endsAt
        }
      });

    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_ROLE_ASSIGNED,
      entityType: "User",
      entityId: user.id,
      before,
      after,
      metadata: { roleId: role.id, roleCode: role.code, scopeType: scope.scopeType, scopeId: scope.scopeId }
    }, tx);
    return after;
  });
}

export async function removeUserRoleService(ctx: TenantContext, input: z.infer<typeof removeUserRoleSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.manage" });
  return db.$transaction(async (tx) => {
    const scope = tenantRoleScope(input);
    if (scope.scopeType === "BRANCH") {
      if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(scope.scopeId)) throw new AppError("FORBIDDEN_BRANCH_ACCESS", "FORBIDDEN_BRANCH_ACCESS", 403);
      const branch = await tx.branch.findFirst({
        where: { id: scope.scopeId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (!branch) throw notFound("BRANCH_NOT_FOUND");
    }
    if (scope.scopeType === "ACADEMIC_YEAR") {
      const academicYear = await tx.academicYear.findFirst({
        where: { id: scope.scopeId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
        select: { id: true }
      });
      if (!academicYear) throw notFound("ACADEMIC_YEAR_NOT_FOUND");
    }

    const user = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, input.userId),
      select: { id: true }
    });
    if (!user) throw notFound("USER_NOT_FOUND");

    const role = await tx.role.findFirst({
      where: { id: input.roleId, tenantId: ctx.tenantId, isActive: true },
      select: { id: true, code: true }
    });
    if (!role) throw notFound("ROLE_NOT_FOUND");
    assertRoleAssignable(ctx, role.code);

    const before = await tx.userRoleAssignment.findUnique({
      where: {
        tenantId_userId_roleId_scopeType_scopeId: {
          tenantId: ctx.tenantId,
          userId: user.id,
          roleId: role.id,
          scopeType: scope.scopeType,
          scopeId: scope.scopeId
        }
      }
    });
    if (!before?.isActive) throw new AppError("USER_ROLE_ASSIGNMENT_NOT_FOUND", "USER_ROLE_ASSIGNMENT_NOT_FOUND", 404);

    const after = await tx.userRoleAssignment.update({
      where: { id: before.id },
      data: { isActive: false, endsAt: new Date() }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_ROLE_REMOVED,
      entityType: "User",
      entityId: user.id,
      before,
      after,
      metadata: { roleId: role.id, roleCode: role.code, scopeType: scope.scopeType, scopeId: scope.scopeId }
    }, tx);
    return after;
  });
}

export async function assignUserBranchService(ctx: TenantContext, input: z.infer<typeof assignUserBranchSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.update", branchId: input.branchId });
  if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(input.branchId)) throw new AppError("FORBIDDEN_BRANCH_ACCESS", "FORBIDDEN_BRANCH_ACCESS", 403);

  return db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, input.userId),
      select: { id: true, email: true }
    });
    if (!user) throw notFound("USER_NOT_FOUND");

    const branch = await tx.branch.findFirst({
      where: { id: input.branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
      select: { id: true, code: true, name: true }
    });
    if (!branch) throw notFound("BRANCH_NOT_FOUND");

    const before = await tx.userBranchAccess.findUnique({
      where: { tenantId_userId_branchId: { tenantId: ctx.tenantId, userId: user.id, branchId: branch.id } }
    });
    if (before?.isActive) throw new AppError("USER_BRANCH_ALREADY_ASSIGNED", "USER_BRANCH_ALREADY_ASSIGNED", 409);

    const after = before
      ? await tx.userBranchAccess.update({
        where: { id: before.id },
        data: { isActive: true, grantedById: ctx.userId }
      })
      : await tx.userBranchAccess.create({
        data: { tenantId: ctx.tenantId, userId: user.id, branchId: branch.id, grantedById: ctx.userId }
      });

    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_BRANCH_ASSIGNED,
      entityType: "User",
      entityId: user.id,
      branchId: branch.id,
      before,
      after,
      metadata: { branchId: branch.id, branchCode: branch.code }
    }, tx);
    return after;
  });
}

export async function removeUserBranchService(ctx: TenantContext, input: z.infer<typeof removeUserBranchSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.update", branchId: input.branchId });
  if (!isPlatformAdminContext(ctx) && !ctx.accessibleBranchIds.includes(input.branchId)) throw new AppError("FORBIDDEN_BRANCH_ACCESS", "FORBIDDEN_BRANCH_ACCESS", 403);

  return db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, input.userId),
      select: { id: true }
    });
    if (!user) throw notFound("USER_NOT_FOUND");

    const branch = await tx.branch.findFirst({
      where: { id: input.branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
      select: { id: true, code: true }
    });
    if (!branch) throw notFound("BRANCH_NOT_FOUND");

    const before = await tx.userBranchAccess.findUnique({
      where: { tenantId_userId_branchId: { tenantId: ctx.tenantId, userId: user.id, branchId: branch.id } }
    });
    if (!before?.isActive) throw new AppError("USER_BRANCH_ACCESS_NOT_FOUND", "USER_BRANCH_ACCESS_NOT_FOUND", 404);

    const activeBranchAccessCount = await tx.userBranchAccess.count({
      where: { tenantId: ctx.tenantId, userId: user.id, isActive: true }
    });
    if (activeBranchAccessCount <= 1) {
      throw new AppError("USER_BRANCH_ACCESS_REQUIRED", "USER_BRANCH_ACCESS_REQUIRED", 400);
    }

    const after = await tx.userBranchAccess.update({
      where: { id: before.id },
      data: { isActive: false, isPrimary: false }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_BRANCH_REMOVED,
      entityType: "User",
      entityId: user.id,
      branchId: branch.id,
      before,
      after,
      metadata: { branchId: branch.id, branchCode: branch.code }
    }, tx);
    return after;
  });
}

export async function adminResetUserPasswordService(ctx: TenantContext, input: z.infer<typeof adminResetPasswordSchema>) {
  await requirePermission({ ctx, permission: "campuscore.user.reset_password" });
  return db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: targetUserGovernanceWhere(ctx, input.userId),
      select: { id: true, tenantId: true, email: true, status: true }
    });
    if (!user) throw notFound("USER_NOT_FOUND");

    const passwordHash = await hashAccountPassword(input.newPassword);
    await tx.passwordCredential.upsert({
      where: { userId: user.id },
      create: { userId: user.id, passwordHash, mustChange: true },
      update: { passwordHash, passwordUpdatedAt: new Date(), mustChange: true }
    });
    if (user.status === "INVITED") {
      await tx.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", activatedAt: new Date(), updatedById: ctx.userId }
      });
    }

    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_PASSWORD_RESET,
      entityType: "User",
      entityId: user.id,
      metadata: passwordMetadata(user.id)
    }, tx);
    return { userId: user.id };
  });
}

export async function changeOwnPasswordService(ctx: TenantContext, input: z.infer<typeof changeOwnPasswordSchema>) {
  return db.$transaction(async (tx) => {
    const credential = await tx.passwordCredential.findUnique({
      where: { userId: ctx.userId },
      select: { userId: true, passwordHash: true }
    });
    if (!credential) throw new AppError("USER_PASSWORD_NOT_SET", "USER_PASSWORD_NOT_SET", 400);

    const currentPasswordValid = await verifyAccountPassword(input.currentPassword, credential.passwordHash);
    if (!currentPasswordValid) throw new AppError("CURRENT_PASSWORD_INCORRECT", "CURRENT_PASSWORD_INCORRECT", 400);

    const passwordHash = await hashAccountPassword(input.newPassword);
    await tx.passwordCredential.update({
      where: { userId: ctx.userId },
      data: { passwordHash, passwordUpdatedAt: new Date(), mustChange: false }
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_PASSWORD_CHANGED,
      entityType: "User",
      entityId: ctx.userId,
      metadata: passwordMetadata(ctx.userId)
    }, tx);
    return { userId: ctx.userId };
  });
}

export async function requestPasswordRecoveryService(
  input: z.infer<typeof forgotPasswordSchema>,
  options: PasswordRecoveryRequestOptions = {}
) {
  const user = await db.user.findFirst({
    where: {
      email: input.email,
      status: { not: "DEACTIVATED" },
      tenant: { status: "ACTIVE" }
    },
    select: {
      id: true,
      tenantId: true,
      email: true,
      userType: true,
      tenant: { select: { name: true } },
      branchAccesses: {
        where: { isActive: true },
        select: { branchId: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 10
      }
    },
    orderBy: { createdAt: "asc" }
  });

  if (!user) return { requested: true };

  const activeBranchAccess = user.branchAccesses.find((access) => access.isPrimary) ?? user.branchAccesses[0] ?? null;
  await writeAuditLog({
    ctx: {
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      userId: user.id,
      userEmail: user.email,
      userType: user.userType,
      activeBranchId: activeBranchAccess?.branchId ?? null,
      accessibleBranchIds: user.branchAccesses.map((access) => access.branchId),
      activeAcademicYearId: null,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    },
    action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_PASSWORD_RECOVERY_REQUESTED,
    entityType: "User",
    entityId: user.id,
    branchId: activeBranchAccess?.branchId ?? null,
    metadata: {
      recoveryMode: "administrator_assisted",
      emailDeliveryConfigured: false
    }
  }).catch(() => null);

  return { requested: true };
}

export async function createRoleService(ctx: TenantContext, input: z.infer<typeof createRoleSchema>) {
  await requirePermission({ ctx, permission: "campuscore.role.manage" });

  return db.$transaction(async (tx) => {
    const permissionCodes = unique(input.permissionCodes);
    const role = await tx.role.create({ data: { tenantId: ctx.tenantId, code: input.code, name: input.name, description: input.description, scope: input.scope, createdById: ctx.userId } });
    const permissions = await tx.permission.findMany({ where: { code: { in: permissionCodes }, isActive: true } });
    if (permissions.length !== permissionCodes.length) throw new Error("PERMISSION_NOT_FOUND");

    for (const permission of permissions) {
      await tx.rolePermission.create({ data: { tenantId: ctx.tenantId, roleId: role.id, permissionId: permission.id } });
    }
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.ROLE_CREATED, entityType: "Role", entityId: role.id, after: { role, permissions: permissions.map((p) => p.code) } }, tx);
    return role;
  });
}

export async function updateTenantSettingsService(ctx: TenantContext, input: z.infer<typeof updateTenantSettingsSchema>) {
  await requirePermission({ ctx, permission: "campuscore.settings.manage" });
  return db.$transaction(async (tx) => {
    const before = await tx.tenantSettings.findUnique({ where: { tenantId: ctx.tenantId } });
    const after = await tx.tenantSettings.upsert({
      where: { tenantId: ctx.tenantId },
      create: { tenantId: ctx.tenantId, ...input, createdById: ctx.userId },
      update: { ...input, updatedById: ctx.userId }
    });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.SETTINGS_UPDATED, entityType: "TenantSettings", entityId: after.id, before, after }, tx);
    return after;
  });
}

export async function updateAttendanceSettingsService(ctx: TenantContext, input: z.infer<typeof updateAttendanceSettingsSchema>) {
  await requirePermission({ ctx, permission: "campuscore.settings.manage", branchId: input.branchId });
  const existingNotificationSettings = await db.attendanceSetting.findFirst({
    where: { tenantId: ctx.tenantId, branchId: input.branchId },
    select: {
      studentAttendanceWhatsAppEnabled: true,
      studentAttendanceNotificationMode: true,
      staffMonthlySummaryWhatsAppEnabled: true,
      staffMonthlySummarySendDay: true,
      staffMonthlySummarySendTime: true
    }
  });
  const notificationSettingsChanged = existingNotificationSettings
    ? existingNotificationSettings.studentAttendanceWhatsAppEnabled !== input.studentAttendanceWhatsAppEnabled ||
      existingNotificationSettings.studentAttendanceNotificationMode !== input.studentAttendanceNotificationMode ||
      existingNotificationSettings.staffMonthlySummaryWhatsAppEnabled !== input.staffMonthlySummaryWhatsAppEnabled ||
      existingNotificationSettings.staffMonthlySummarySendDay !== input.staffMonthlySummarySendDay ||
      existingNotificationSettings.staffMonthlySummarySendTime !== input.staffMonthlySummarySendTime
    : input.studentAttendanceWhatsAppEnabled ||
      input.studentAttendanceNotificationMode !== "EXCEPTION_ONLY" ||
      input.staffMonthlySummaryWhatsAppEnabled ||
      input.staffMonthlySummarySendDay !== 1 ||
      input.staffMonthlySummarySendTime !== "09:00";

  if (notificationSettingsChanged) {
    const permissions = await getEffectivePermissions({ ctx, branchId: input.branchId });
    if (!permissions.has("notifications.settings.manage")) throw new Error("FORBIDDEN_PERMISSION:notifications.settings.manage");
  }

  return db.$transaction(async (tx) => {
    const branch = await tx.branch.findFirst({
      where: { id: input.branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
      select: { id: true }
    });
    if (!branch) throw new Error("BRANCH_NOT_FOUND");

    const before = await tx.attendanceSetting.findFirst({ where: { tenantId: ctx.tenantId, branchId: input.branchId } });
    const after = await tx.attendanceSetting.upsert({
      where: { branchId: input.branchId },
      create: { tenantId: ctx.tenantId, ...input, createdById: ctx.userId },
      update: { ...input, updatedById: ctx.userId }
    });
    await writeAuditLog({ ctx, action: CAMPUS_CORE_AUDIT_EVENTS.ATTENDANCE_SETTINGS_UPDATED, entityType: "AttendanceSetting", entityId: after.id, branchId: input.branchId, before, after }, tx);
    return after;
  });
}

export async function getCampusCoreDashboardService(ctx: TenantContext) {
  await requirePermission({ ctx, permission: "campuscore.tenant.view" });
  const branchScope = isPlatformAdminContext(ctx) ? {} : { id: { in: ctx.accessibleBranchIds } };
  const userBranchScope = isPlatformAdminContext(ctx)
    ? {}
    : {
      OR: [
        { id: ctx.userId },
        { branchAccesses: { some: { tenantId: ctx.tenantId, isActive: true, branchId: { in: ctx.accessibleBranchIds } } } }
      ]
    };
  const auditBranchScope = isPlatformAdminContext(ctx)
    ? {}
    : { OR: [{ branchId: null }, { branchId: { in: ctx.accessibleBranchIds } }] };
  const [totalBranches, activeAcademicYear, totalUsers, activeRoles, recentAuditLogs] = await Promise.all([
    db.branch.count({ where: { tenantId: ctx.tenantId, ...branchScope, status: "ACTIVE" } }),
    db.academicYear.findFirst({ where: { tenantId: ctx.tenantId, isActive: true, status: "ACTIVE" }, orderBy: { startDate: "desc" } }),
    db.user.count({
      where: {
        tenantId: ctx.tenantId,
        status: "ACTIVE",
        ...userBranchScope
      }
    }),
    db.role.count({ where: { tenantId: ctx.tenantId, isActive: true } }),
    db.auditLog.findMany({
      where: { tenantId: ctx.tenantId, ...auditBranchScope },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);
  return { totalBranches, activeAcademicYear, totalUsers, activeRoles, recentAuditLogs };
}
