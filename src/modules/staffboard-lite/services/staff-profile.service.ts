import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { requirePermission } from "@/lib/rbac/require-permission";
import { canAssignRole } from "@/lib/rbac/roles";
import type { TenantContext } from "@/lib/tenant/context";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import { STAFFBOARD_LITE_AUDIT_EVENTS } from "@/modules/staffboard-lite/audit-events";
import {
  createStaffLoginAccessSchema,
  createStaffProfileSchema,
  disableStaffLoginAccessSchema,
  updateStaffProfileSchema
} from "@/modules/staffboard-lite/schemas";
import { employmentStatusSchema, idSchema } from "@/modules/staffboard-lite/schemas/shared";
import { staffProfileSelect } from "@/modules/staffboard-lite/queries/staff-profile.queries";
import { conflict, ensureActiveBranch, requireBranchPermission } from "./shared";

type StaffLoginRoleCode = "STAFF" | "TEACHER" | "CLASS_TEACHER" | "OFFICE_STAFF";

type StaffLoginAccountInput = {
  branchId: string;
  email: string;
  phone?: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  loginRoleCode: StaffLoginRoleCode;
  initialPassword: string;
};

function userDisplayName(input: { firstName?: string | null; lastName?: string | null }) {
  return [input.firstName, input.lastName].filter(Boolean).join(" ");
}

function sanitizeUserForAudit<T extends object>(user: T) {
  const { passwordCredential: _passwordCredential, ...safeUser } = user as Record<string, unknown>;
  return safeUser;
}

async function requireStaffLoginAccessPermissions(ctx: TenantContext, branchId: string, roleCode: StaffLoginRoleCode) {
  await requirePermission({ ctx, permission: "campuscore.user.create" });
  await requirePermission({ ctx, permission: "campuscore.user.update", branchId });
  await requirePermission({ ctx, permission: "campuscore.user.manage" });
  if (!canAssignRole(ctx.roleCodes ?? [], roleCode)) {
    throw new AppError("ROLE_ASSIGNMENT_NOT_ALLOWED", "ROLE_ASSIGNMENT_NOT_ALLOWED", 403);
  }
}

async function createStaffLoginAccount(
  tx: Prisma.TransactionClient,
  ctx: TenantContext,
  input: StaffLoginAccountInput
) {
  const existingEmailUser = await tx.user.findUnique({
    where: { tenantId_email: { tenantId: ctx.tenantId, email: input.email } },
    select: { id: true }
  });
  if (existingEmailUser) throw conflict("STAFF_LOGIN_EMAIL_EXISTS");

  if (input.phone) {
    const existingPhoneUser = await tx.user.findUnique({
      where: { tenantId_phone: { tenantId: ctx.tenantId, phone: input.phone } },
      select: { id: true }
    });
    if (existingPhoneUser) throw conflict("STAFF_LOGIN_PHONE_EXISTS");
  }

  const role = await tx.role.findFirst({
    where: { tenantId: ctx.tenantId, code: input.loginRoleCode, isActive: true },
    select: { id: true, code: true, name: true }
  });
  if (!role) throw notFound("ROLE_NOT_FOUND");

  const { hashPassword } = await import("@/lib/auth/password");
  const passwordHash = await hashPassword(input.initialPassword);
  const user = await tx.user.create({
    data: {
      tenantId: ctx.tenantId,
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      displayName: userDisplayName(input),
      userType: "STAFF",
      status: "ACTIVE",
      activatedAt: new Date(),
      createdById: ctx.userId
    },
    select: {
      id: true,
      tenantId: true,
      email: true,
      phone: true,
      firstName: true,
      middleName: true,
      lastName: true,
      displayName: true,
      userType: true,
      status: true,
      createdById: true,
      createdAt: true,
      updatedAt: true
    }
  });

  await tx.passwordCredential.create({
    data: { userId: user.id, passwordHash, mustChange: true }
  });

  const branchAccess = await tx.userBranchAccess.create({
    data: {
      tenantId: ctx.tenantId,
      userId: user.id,
      branchId: input.branchId,
      isPrimary: true,
      grantedById: ctx.userId
    }
  });

  const roleAssignment = await tx.userRoleAssignment.create({
    data: {
      tenantId: ctx.tenantId,
      userId: user.id,
      roleId: role.id,
      scopeType: "TENANT",
      scopeId: "TENANT",
      assignedById: ctx.userId
    }
  });

  return { branchAccess, role, roleAssignment, user };
}

export async function createStaffProfile(ctx: TenantContext, input: unknown) {
  const data = createStaffProfileSchema.parse(input);
  await requireBranchPermission(ctx, "staffboard.staff.create", data.branchId);
  if (data.createLoginAccess) {
    await requireStaffLoginAccessPermissions(ctx, data.branchId, data.loginRoleCode);
  }

  return db.$transaction(async (tx) => {
    await ensureActiveBranch(tx, ctx, data.branchId);

    const existing = await tx.staffProfile.findFirst({
      where: { tenantId: ctx.tenantId, employeeCode: data.employeeCode },
      select: { id: true }
    });
    if (existing) throw conflict("STAFF_EMPLOYEE_CODE_EXISTS");

    const {
      createLoginAccess,
      loginRoleCode,
      initialPassword,
      confirmInitialPassword: _confirmInitialPassword,
      ...profileData
    } = data;

    const loginAccount = createLoginAccess && initialPassword && profileData.email
      ? await createStaffLoginAccount(tx, ctx, {
        branchId: profileData.branchId,
        email: profileData.email,
        phone: profileData.phone,
        firstName: profileData.firstName,
        middleName: profileData.middleName,
        lastName: profileData.lastName,
        loginRoleCode,
        initialPassword
      })
      : null;

    const staffProfile = await tx.staffProfile.create({
      data: {
        ...profileData,
        tenantId: ctx.tenantId,
        userId: loginAccount?.user.id
      },
      select: staffProfileSelect
    });
    await writeAuditLog({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_CREATED,
      entityType: "StaffProfile",
      entityId: staffProfile.id,
      branchId: staffProfile.branchId,
      after: staffProfile
    }, tx);
    if (loginAccount) {
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.USER_CREATED,
        entityType: "User",
        entityId: loginAccount.user.id,
        after: sanitizeUserForAudit(loginAccount.user),
        metadata: { createdFrom: "staff_profile", linkedStaffProfileId: staffProfile.id, initialPasswordSet: true }
      }, tx);
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.USER_BRANCH_ASSIGNED,
        entityType: "User",
        entityId: loginAccount.user.id,
        branchId: staffProfile.branchId,
        after: loginAccount.branchAccess,
        metadata: { branchId: staffProfile.branchId, source: "staff_profile_login_access" }
      }, tx);
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.USER_ROLE_ASSIGNED,
        entityType: "User",
        entityId: loginAccount.user.id,
        after: loginAccount.roleAssignment,
        metadata: {
          roleId: loginAccount.role.id,
          roleCode: loginAccount.role.code,
          scopeType: "TENANT",
          scopeId: "TENANT",
          source: "staff_profile_login_access"
        }
      }, tx);
      await writeAuditLog({
        ctx,
        action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_LOGIN_ACCESS_CREATED,
        entityType: "StaffProfile",
        entityId: staffProfile.id,
        branchId: staffProfile.branchId,
        metadata: { userId: loginAccount.user.id, roleCode: loginAccount.role.code }
      }, tx);
    }
    return staffProfile;
  });
}

export async function createStaffLoginAccess(ctx: TenantContext, input: unknown) {
  const data = createStaffLoginAccessSchema.parse(input);

  return db.$transaction(async (tx) => {
    const staffProfile = await tx.staffProfile.findFirst({
      where: { id: data.staffId, tenantId: ctx.tenantId },
      select: {
        id: true,
        branchId: true,
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        employeeCode: true
      }
    });
    if (!staffProfile) throw notFound("STAFF_PROFILE_NOT_FOUND");
    if (staffProfile.userId) throw conflict("STAFF_LOGIN_ACCESS_ALREADY_ENABLED");

    await requireBranchPermission(ctx, "staffboard.staff.update", staffProfile.branchId);
    await requireStaffLoginAccessPermissions(ctx, staffProfile.branchId, data.loginRoleCode);

    const loginAccount = await createStaffLoginAccount(tx, ctx, {
      branchId: staffProfile.branchId,
      email: data.email,
      phone: data.phone,
      firstName: staffProfile.firstName,
      middleName: staffProfile.middleName,
      lastName: staffProfile.lastName,
      loginRoleCode: data.loginRoleCode,
      initialPassword: data.initialPassword
    });

    const after = await tx.staffProfile.update({
      where: { id: staffProfile.id },
      data: { userId: loginAccount.user.id },
      select: staffProfileSelect
    });

    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_CREATED,
      entityType: "User",
      entityId: loginAccount.user.id,
      after: sanitizeUserForAudit(loginAccount.user),
      metadata: { createdFrom: "staff_profile_edit", linkedStaffProfileId: staffProfile.id, initialPasswordSet: true }
    }, tx);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_BRANCH_ASSIGNED,
      entityType: "User",
      entityId: loginAccount.user.id,
      branchId: staffProfile.branchId,
      after: loginAccount.branchAccess,
      metadata: { branchId: staffProfile.branchId, source: "staff_profile_login_access" }
    }, tx);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_ROLE_ASSIGNED,
      entityType: "User",
      entityId: loginAccount.user.id,
      after: loginAccount.roleAssignment,
      metadata: {
        roleId: loginAccount.role.id,
        roleCode: loginAccount.role.code,
        scopeType: "TENANT",
        scopeId: "TENANT",
        source: "staff_profile_login_access"
      }
    }, tx);
    await writeAuditLog({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_LOGIN_ACCESS_CREATED,
      entityType: "StaffProfile",
      entityId: after.id,
      branchId: after.branchId,
      before: staffProfile,
      after,
      metadata: { userId: loginAccount.user.id, roleCode: loginAccount.role.code }
    }, tx);
    return after;
  });
}

export async function disableStaffLoginAccess(ctx: TenantContext, input: unknown) {
  const data = disableStaffLoginAccessSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.staffProfile.findFirst({
      where: { id: data.staffId, tenantId: ctx.tenantId },
      select: {
        ...staffProfileSelect,
        user: {
          select: {
            id: true,
            tenantId: true,
            email: true,
            status: true
          }
        }
      }
    });
    if (!before) throw notFound("STAFF_PROFILE_NOT_FOUND");
    if (!before.user) throw new AppError("STAFF_LOGIN_ACCESS_NOT_ENABLED", "STAFF_LOGIN_ACCESS_NOT_ENABLED", 400);

    await requireBranchPermission(ctx, "staffboard.staff.update", before.branchId);
    await requirePermission({ ctx, permission: "campuscore.user.deactivate" });

    const deactivatedUser = await tx.user.update({
      where: { id: before.user.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
        updatedById: ctx.userId
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        status: true,
        deactivatedAt: true,
        updatedAt: true
      }
    });
    await tx.session.updateMany({
      where: { tenantId: ctx.tenantId, userId: before.user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    const after = await tx.staffProfile.update({
      where: { id: before.id },
      data: { userId: null },
      select: staffProfileSelect
    });
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.USER_DEACTIVATED,
      entityType: "User",
      entityId: before.user.id,
      before: before.user,
      after: deactivatedUser,
      metadata: { sessionsRevoked: true, source: "staff_profile_login_access_disabled" }
    }, tx);
    await writeAuditLog({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_LOGIN_ACCESS_DISABLED,
      entityType: "StaffProfile",
      entityId: after.id,
      branchId: after.branchId,
      before,
      after,
      metadata: { userId: before.user.id }
    }, tx);
    return after;
  });
}

export async function updateStaffProfile(ctx: TenantContext, input: unknown) {
  const { staffId, ...data } = updateStaffProfileSchema.parse(input);

  return db.$transaction(async (tx) => {
    const before = await tx.staffProfile.findFirst({ where: { id: staffId, tenantId: ctx.tenantId } });
    if (!before) throw notFound("STAFF_PROFILE_NOT_FOUND");

    await requireBranchPermission(ctx, "staffboard.staff.update", before.branchId);
    if (data.branchId && data.branchId !== before.branchId) {
      await requireBranchPermission(ctx, "staffboard.staff.update", data.branchId);
      await ensureActiveBranch(tx, ctx, data.branchId);
    }
    if (data.employmentStatus && data.employmentStatus !== before.employmentStatus && data.employmentStatus !== "ACTIVE") {
      await requireBranchPermission(ctx, "staffboard.staff.deactivate", before.branchId);
    }

    if (data.employeeCode && data.employeeCode !== before.employeeCode) {
      const duplicate = await tx.staffProfile.findFirst({
        where: { tenantId: ctx.tenantId, employeeCode: data.employeeCode, id: { not: staffId } },
        select: { id: true }
      });
      if (duplicate) throw conflict("STAFF_EMPLOYEE_CODE_EXISTS");
    }

    const after = await tx.staffProfile.update({
      where: { id: staffId },
      data,
      select: staffProfileSelect
    });
    await writeAuditLog({
      ctx,
      action:
        data.employmentStatus && data.employmentStatus !== before.employmentStatus
          ? STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_EMPLOYMENT_STATUS_CHANGED
          : STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_UPDATED,
      entityType: "StaffProfile",
      entityId: after.id,
      branchId: after.branchId,
      before,
      after,
      metadata:
        data.employmentStatus && data.employmentStatus !== before.employmentStatus
          ? { previousStatus: before.employmentStatus, newStatus: data.employmentStatus }
          : undefined
    }, tx);
    return after;
  });
}

export async function updateStaffEmploymentStatus(ctx: TenantContext, staffId: string, status: unknown) {
  const id = idSchema.parse(staffId);
  const nextStatus = employmentStatusSchema.parse(status);
  const permission = nextStatus === "ACTIVE" ? "staffboard.staff.update" : "staffboard.staff.deactivate";

  return db.$transaction(async (tx) => {
    const before = await tx.staffProfile.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!before) throw notFound("STAFF_PROFILE_NOT_FOUND");

    await requireBranchPermission(ctx, permission, before.branchId);
    const after = await tx.staffProfile.update({
      where: { id },
      data: { employmentStatus: nextStatus },
      select: staffProfileSelect
    });
    await writeAuditLog({
      ctx,
      action:
        nextStatus === "INACTIVE"
          ? STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_DEACTIVATED
          : STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_EMPLOYMENT_STATUS_CHANGED,
      entityType: "StaffProfile",
      entityId: after.id,
      branchId: after.branchId,
      before,
      after,
      metadata: { previousStatus: before.employmentStatus, newStatus: nextStatus }
    }, tx);
    return after;
  });
}

export async function deactivateStaffProfile(ctx: TenantContext, staffId: string) {
  return updateStaffEmploymentStatus(ctx, staffId, "INACTIVE");
}
