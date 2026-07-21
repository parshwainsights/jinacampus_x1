import type { OtpPurpose, Prisma, PrismaClient } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit/audit-log";
import {
  deliverOtp,
  generateNumericOtp,
  getOtpExpiresAt,
  hashOtp,
  maskPhone,
  normalizePhone,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  verifyOtp
} from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { createRawSessionToken, getSessionExpiresAt, hashSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/context";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import { getPostLoginRedirectPath } from "@/modules/campus-core/auth-redirect";
import type {
  AdminOtpRequestInput,
  AdminOtpVerifyInput,
  ForgotPasswordRequestInput,
  ForgotPasswordResetInput
} from "@/modules/campus-core/otp-auth.schemas";
import { validateSchoolId } from "@/modules/campus-core/tenant-login-policy";

export const OTP_REQUEST_PUBLIC_MESSAGE = "If the number is registered, an OTP has been sent.";
export const PASSWORD_RESET_REQUEST_PUBLIC_MESSAGE =
  "If the account is registered and eligible, an OTP has been sent to the linked contact number.";
export const OTP_VERIFY_ERROR_MESSAGE = "The OTP is invalid, expired, or has reached the attempt limit.";

export class OtpAuthError extends Error {
  constructor(public readonly code: "INVALID_REQUEST" | "INVALID_OTP") {
    super(code);
    this.name = "OtpAuthError";
  }
}

type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

const authUserInclude = {
  branchAccesses: {
    where: { isActive: true },
    select: { branchId: true, isPrimary: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    take: 20
  },
  roleAssignments: {
    where: { isActive: true },
    select: {
      startsAt: true,
      endsAt: true,
      role: { select: { code: true, isActive: true, tenantId: true } }
    }
  }
} satisfies Prisma.UserInclude;

type AuthUser = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

function safeSchoolId(value: string) {
  const result = validateSchoolId(value);
  return result.ok ? result.schoolId : null;
}

function isActiveAssignment(assignment: AuthUser["roleAssignments"][number], tenantId: string, now: Date) {
  return assignment.role.tenantId === tenantId &&
    assignment.role.isActive &&
    (!assignment.startsAt || assignment.startsAt <= now) &&
    (!assignment.endsAt || assignment.endsAt > now);
}

function roleCodes(user: AuthUser, now: Date) {
  return Array.from(new Set(
    user.roleAssignments
      .filter((assignment) => isActiveAssignment(assignment, user.tenantId, now))
      .map((assignment) => assignment.role.code)
  ));
}

function canUseAdminOtp(user: AuthUser, now: Date) {
  const roles = roleCodes(user, now);
  return roles.includes("TENANT_OWNER") || roles.includes("ADMIN");
}

function auditContext(
  tenant: { id: string; name: string },
  user: AuthUser,
  metadata: RequestMetadata
): TenantContext {
  const primaryBranch = user.branchAccesses.find((branch) => branch.isPrimary) ?? user.branchAccesses[0] ?? null;
  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    userId: user.id,
    userEmail: user.email,
    userType: user.userType,
    activeBranchId: primaryBranch?.branchId ?? null,
    accessibleBranchIds: user.branchAccesses.map((branch) => branch.branchId),
    activeAcademicYearId: null,
    roleCodes: roleCodes(user, new Date()),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  };
}

async function findActiveTenantAndUserByPhone(
  client: DbClient,
  tenantSlug: string,
  phone: string
) {
  const schoolId = safeSchoolId(tenantSlug);
  const normalizedPhone = normalizePhone(phone);
  if (!schoolId || !normalizedPhone) return null;

  const tenant = await client.tenant.findUnique({
    where: { slug: schoolId },
    select: { id: true, name: true, status: true }
  });
  if (!tenant || tenant.status !== "ACTIVE") return null;

  const user = await client.user.findUnique({
    where: { tenantId_phone: { tenantId: tenant.id, phone: normalizedPhone } },
    include: authUserInclude
  });
  if (!user || user.status !== "ACTIVE") return null;

  return { tenant, user, phone: normalizedPhone };
}

async function findActiveTenantAndUserByIdentifier(
  client: DbClient,
  input: ForgotPasswordRequestInput
) {
  const schoolId = safeSchoolId(input.tenantSlug);
  if (!schoolId) return null;

  const tenant = await client.tenant.findUnique({
    where: { slug: schoolId },
    select: { id: true, name: true, status: true }
  });
  if (!tenant || tenant.status !== "ACTIVE") return null;

  const normalizedEmail = input.email?.trim().toLowerCase();
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;
  if (!normalizedEmail && !normalizedPhone) return null;

  const user = normalizedEmail
    ? await client.user.findUnique({
        where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
        include: authUserInclude
      })
    : await client.user.findUnique({
        where: { tenantId_phone: { tenantId: tenant.id, phone: normalizedPhone! } },
        include: authUserInclude
      });
  if (!user || user.status !== "ACTIVE" || !user.phone) return null;

  const linkedPhone = normalizePhone(user.phone);
  if (!linkedPhone) return null;
  return { tenant, user, phone: linkedPhone };
}

async function createOtpForUser(input: {
  tenant: { id: string; name: string };
  user: AuthUser;
  phone: string;
  purpose: OtpPurpose;
  metadata: RequestMetadata;
  additionalAuditAction?: string;
}) {
  const now = new Date();
  const cooldownStartedAt = new Date(now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const otp = generateNumericOtp();
  const otpHash = hashOtp(otp);

  const created = await db.$transaction(async (tx) => {
    const recent = await tx.loginOtp.findFirst({
      where: {
        tenantId: input.tenant.id,
        userId: input.user.id,
        purpose: input.purpose,
        consumedAt: null,
        createdAt: { gte: cooldownStartedAt }
      },
      select: { id: true }
    });
    if (recent) return false;

    await tx.loginOtp.updateMany({
      where: {
        tenantId: input.tenant.id,
        userId: input.user.id,
        purpose: input.purpose,
        consumedAt: null,
        expiresAt: { gt: now }
      },
      data: { expiresAt: now }
    });
    await tx.loginOtp.create({
      data: {
        tenantId: input.tenant.id,
        userId: input.user.id,
        phone: input.phone,
        otpHash,
        purpose: input.purpose,
        expiresAt: getOtpExpiresAt(now),
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent
      }
    });

    const ctx = auditContext(input.tenant, input.user, input.metadata);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_REQUESTED,
      entityType: "User",
      entityId: input.user.id,
      branchId: ctx.activeBranchId,
      metadata: { purpose: input.purpose, phone: maskPhone(input.phone) }
    }, tx);
    if (input.additionalAuditAction) {
      await writeAuditLog({
        ctx,
        action: input.additionalAuditAction,
        entityType: "User",
        entityId: input.user.id,
        branchId: ctx.activeBranchId,
        metadata: { recoveryMethod: "OTP" }
      }, tx);
    }
    return true;
  });

  if (created) await deliverOtp({ phone: input.phone, otp, purpose: input.purpose });
}

export async function requestAdminLoginOtp(input: AdminOtpRequestInput, metadata: RequestMetadata = {}) {
  const resolved = await findActiveTenantAndUserByPhone(db, input.tenantSlug, input.phone);
  if (!resolved || !canUseAdminOtp(resolved.user, new Date())) return { requested: true };

  await createOtpForUser({ ...resolved, purpose: "ADMIN_LOGIN", metadata });
  return { requested: true };
}

export async function requestForgotPasswordOtp(input: ForgotPasswordRequestInput, metadata: RequestMetadata = {}) {
  const resolved = await findActiveTenantAndUserByIdentifier(db, input);
  if (!resolved) return { requested: true };

  await createOtpForUser({
    ...resolved,
    purpose: "FORGOT_PASSWORD",
    metadata,
    additionalAuditAction: CAMPUS_CORE_AUDIT_EVENTS.AUTH_PASSWORD_RESET_REQUESTED
  });
  return { requested: true };
}

async function recordOtpFailure(
  tx: Prisma.TransactionClient,
  resolved: NonNullable<Awaited<ReturnType<typeof findActiveTenantAndUserByPhone>>>,
  metadata: RequestMetadata,
  reason: string,
  otpId?: string,
  attempts?: number
) {
  if (otpId && attempts !== undefined && attempts < OTP_MAX_ATTEMPTS) {
    await tx.loginOtp.update({ where: { id: otpId }, data: { attempts: attempts + 1 } });
  }
  const ctx = auditContext(resolved.tenant, resolved.user, metadata);
  await writeAuditLog({
    ctx,
    action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_FAILED,
    entityType: "User",
    entityId: resolved.user.id,
    branchId: ctx.activeBranchId,
    metadata: { purpose: "ADMIN_LOGIN", reason }
  }, tx);
}

export async function verifyAdminLoginOtp(input: AdminOtpVerifyInput, metadata: RequestMetadata = {}) {
  const now = new Date();
  const rawToken = createRawSessionToken();
  const tokenHash = await hashSessionToken(rawToken);
  const sessionExpiresAt = getSessionExpiresAt();

  const result = await db.$transaction(async (tx) => {
    const resolved = await findActiveTenantAndUserByPhone(tx, input.tenantSlug, input.phone);
    if (!resolved || !canUseAdminOtp(resolved.user, now)) return null;

    const otpRecord = await tx.loginOtp.findFirst({
      where: {
        tenantId: resolved.tenant.id,
        userId: resolved.user.id,
        phone: resolved.phone,
        purpose: "ADMIN_LOGIN",
        consumedAt: null
      },
      orderBy: { createdAt: "desc" }
    });
    if (!otpRecord || otpRecord.expiresAt <= now || otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await recordOtpFailure(tx, resolved, metadata, "INVALID_OR_EXPIRED", otpRecord?.id, otpRecord?.attempts);
      return null;
    }
    if (!verifyOtp(input.otp, otpRecord.otpHash)) {
      await recordOtpFailure(tx, resolved, metadata, "MISMATCH", otpRecord.id, otpRecord.attempts);
      return null;
    }

    const consumed = await tx.loginOtp.updateMany({
      where: { id: otpRecord.id, consumedAt: null },
      data: { consumedAt: now }
    });
    if (consumed.count !== 1) return null;

    await tx.session.create({
      data: {
        tenantId: resolved.tenant.id,
        userId: resolved.user.id,
        tokenHash,
        expiresAt: sessionExpiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      }
    });
    await tx.user.update({ where: { id: resolved.user.id }, data: { lastLoginAt: now } });

    const ctx = auditContext(resolved.tenant, resolved.user, metadata);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_VERIFIED,
      entityType: "User",
      entityId: resolved.user.id,
      branchId: ctx.activeBranchId,
      metadata: { purpose: "ADMIN_LOGIN" }
    }, tx);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_LOGIN_OTP_SUCCESS,
      entityType: "User",
      entityId: resolved.user.id,
      branchId: ctx.activeBranchId,
      metadata: { loginMethod: "OTP" }
    }, tx);

    return { roleCodes: roleCodes(resolved.user, now) };
  });

  if (!result) throw new OtpAuthError("INVALID_OTP");
  return {
    rawToken,
    expiresAt: sessionExpiresAt,
    redirectTo: getPostLoginRedirectPath(result.roleCodes)
  };
}

export async function resetPasswordWithOtp(input: ForgotPasswordResetInput, metadata: RequestMetadata = {}) {
  const now = new Date();
  const passwordHash = await hashPassword(input.newPassword);

  const result = await db.$transaction(async (tx) => {
    const resolved = await findActiveTenantAndUserByIdentifier(tx, input);
    if (!resolved) return null;

    const otpRecord = await tx.loginOtp.findFirst({
      where: {
        tenantId: resolved.tenant.id,
        userId: resolved.user.id,
        phone: resolved.phone,
        purpose: "FORGOT_PASSWORD",
        consumedAt: null
      },
      orderBy: { createdAt: "desc" }
    });
    if (!otpRecord || otpRecord.expiresAt <= now || otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      if (otpRecord && otpRecord.attempts < OTP_MAX_ATTEMPTS) {
        await tx.loginOtp.update({ where: { id: otpRecord.id }, data: { attempts: otpRecord.attempts + 1 } });
      }
      const ctx = auditContext(resolved.tenant, resolved.user, metadata);
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_FAILED,
        entityType: "User",
        entityId: resolved.user.id,
        branchId: ctx.activeBranchId,
        metadata: { purpose: "FORGOT_PASSWORD", reason: "INVALID_OR_EXPIRED" }
      }, tx);
      return null;
    }
    if (!verifyOtp(input.otp, otpRecord.otpHash)) {
      await tx.loginOtp.update({ where: { id: otpRecord.id }, data: { attempts: otpRecord.attempts + 1 } });
      const ctx = auditContext(resolved.tenant, resolved.user, metadata);
      await writeAuditLog({
        ctx,
        action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_FAILED,
        entityType: "User",
        entityId: resolved.user.id,
        branchId: ctx.activeBranchId,
        metadata: { purpose: "FORGOT_PASSWORD", reason: "MISMATCH" }
      }, tx);
      return null;
    }

    const consumed = await tx.loginOtp.updateMany({
      where: { id: otpRecord.id, consumedAt: null },
      data: { consumedAt: now }
    });
    if (consumed.count !== 1) return null;

    await tx.passwordCredential.upsert({
      where: { userId: resolved.user.id },
      create: { userId: resolved.user.id, passwordHash, mustChange: false, passwordUpdatedAt: now },
      update: { passwordHash, mustChange: false, passwordUpdatedAt: now }
    });
    await tx.session.updateMany({
      where: { tenantId: resolved.tenant.id, userId: resolved.user.id, revokedAt: null },
      data: { revokedAt: now }
    });

    const ctx = auditContext(resolved.tenant, resolved.user, metadata);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_OTP_VERIFIED,
      entityType: "User",
      entityId: resolved.user.id,
      branchId: ctx.activeBranchId,
      metadata: { purpose: "FORGOT_PASSWORD" }
    }, tx);
    await writeAuditLog({
      ctx,
      action: CAMPUS_CORE_AUDIT_EVENTS.AUTH_PASSWORD_RESET_COMPLETED,
      entityType: "User",
      entityId: resolved.user.id,
      branchId: ctx.activeBranchId,
      metadata: { resetMethod: "OTP", sessionsRevoked: true }
    }, tx);
    return { reset: true };
  });

  if (!result) throw new OtpAuthError("INVALID_OTP");
  return result;
}
