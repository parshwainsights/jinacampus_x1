import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { hashPassword } from "@/lib/auth/password";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { DEFAULT_ROLE_CODES, DEFAULT_ROLE_PERMISSION_MAP, hasPlatformAdminRole } from "@/lib/rbac/roles";
import type { PermissionCode } from "@/lib/rbac/permissions";
import type { TenantContext } from "@/lib/tenant/context";
import { CAMPUS_CORE_AUDIT_EVENTS } from "@/modules/campus-core/audit-events";
import {
  SCHOOL_ID_ERROR_MESSAGES,
  validateSchoolId
} from "@/modules/campus-core/tenant-login-policy";
import type {
  createSchoolSchema,
  deactivateSchoolSchema,
  deleteSchoolSchema,
  reactivateSchoolSchema,
  updateSchoolIdSchema,
  updateSchoolSchema
} from "@/modules/campus-core/administrator-schemas";
import type { z } from "zod";

type SchoolDbClient = typeof db | Prisma.TransactionClient;

export type SchoolDependencySummary = {
  institutions: number;
  branches: number;
  users: number;
  students: number;
  staffProfiles: number;
  studentAttendanceRecords: number;
  staffAttendanceRecords: number;
  auditLogs: number;
  notificationOutboxItems: number;
  roles: number;
};

function hasDependencies(summary: SchoolDependencySummary) {
  return Object.values(summary).some((count) => count > 0);
}

async function requirePlatformPermission(ctx: TenantContext, permission: PermissionCode) {
  if (!hasPlatformAdminRole(ctx.roleCodes ?? [])) {
    throw new AppError("ADMINISTRATOR_ACCESS_REQUIRED", "ADMINISTRATOR_ACCESS_REQUIRED", 403);
  }
  const permissions = await getEffectivePermissions({ ctx });
  if (!permissions.has(permission)) throw new AppError(`FORBIDDEN_PERMISSION:${permission}`, `FORBIDDEN_PERMISSION:${permission}`, 403);
}

export async function assertSchoolIdAvailable(client: SchoolDbClient, schoolId: string, excludeTenantId?: string) {
  const validation = validateSchoolId(schoolId);
  if (!validation.ok) {
    throw new AppError("INVALID_SCHOOL_ID", validation.message, 400);
  }

  const existing = await client.tenant.findUnique({
    where: { slug: validation.schoolId },
    select: { id: true }
  });
  if (existing && existing.id !== excludeTenantId) {
    throw new AppError("SCHOOL_ID_ALREADY_EXISTS", SCHOOL_ID_ERROR_MESSAGES.duplicate, 409);
  }
}

async function ensureDefaultRolesForTenant(tx: Prisma.TransactionClient, tenantId: string, actorUserId: string) {
  for (const roleCode of DEFAULT_ROLE_CODES) {
    const role = await tx.role.upsert({
      where: { tenantId_code: { tenantId, code: roleCode } },
      create: {
        tenantId,
        code: roleCode,
        name: roleCode
          .toLowerCase()
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        isSystem: true,
        isMutable: roleCode !== "TENANT_OWNER",
        createdById: actorUserId
      },
      update: { isActive: true }
    });

    for (const permissionCode of DEFAULT_ROLE_PERMISSION_MAP[roleCode]) {
      const permission = await tx.permission.findUnique({ where: { code: permissionCode } });
      if (!permission) continue;
      await tx.rolePermission.upsert({
        where: { tenantId_roleId_permissionId: { tenantId, roleId: role.id, permissionId: permission.id } },
        create: { tenantId, roleId: role.id, permissionId: permission.id },
        update: {}
      });
    }
  }
}

function administratorAuditContext(ctx: TenantContext): TenantContext {
  return {
    ...ctx,
    activeBranchId: null,
    activeAcademicYearId: null
  };
}

const ADMINISTRATOR_DASHBOARD_TIME_ZONE = "Asia/Kolkata";

function todayDateInTimeZone(timeZone = ADMINISTRATOR_DASHBOARD_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(valueByType.get("year"));
  const month = Number(valueByType.get("month"));
  const day = Number(valueByType.get("day"));
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getAdministratorDashboard(ctx: TenantContext) {
  await requirePlatformPermission(ctx, "platform.dashboard.view");
  const [totalSchools, activeSchools, inactiveSchools, recentlyCreatedSchools, schoolsNeedingSetup] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { status: "ACTIVE" } }),
    db.tenant.count({ where: { status: { not: "ACTIVE" } } }),
    db.tenant.findMany({
      select: { id: true, name: true, slug: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.tenant.count({
      where: {
        OR: [
          { institutions: { none: {} } },
          { branches: { none: {} } },
          { users: { none: {} } }
        ]
      }
    })
  ]);

  return { totalSchools, activeSchools, inactiveSchools, recentlyCreatedSchools, schoolsNeedingSetup };
}

export async function getSchoolDashboardForAdministrator(ctx: TenantContext, tenantId: string) {
  await requirePlatformPermission(ctx, "platform.school.view");
  const today = todayDateInTimeZone();
  const [
    school,
    activeBranches,
    activeUsers,
    activeStudents,
    activeStaff,
    activeAcademicYears,
    studentAttendanceMarkedToday,
    staffAttendanceRecordedToday,
    staffCheckedInToday,
    attendanceNotificationBranches,
    enabledWhatsAppProviders
  ] = await Promise.all([
    db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        legalName: true,
        supportEmail: true,
        phone: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        institutions: {
          select: { id: true, name: true, displayName: true, status: true, logoUrl: true },
          orderBy: { name: "asc" },
          take: 5
        },
        branches: {
          select: { id: true, name: true, code: true, status: true },
          orderBy: { name: "asc" },
          take: 5
        },
        _count: {
          select: {
            institutions: true,
            branches: true,
            users: true,
            students: true,
            staffProfiles: true,
            notificationOutboxItems: true
          }
        }
      }
    }),
    db.branch.count({ where: { tenantId, status: "ACTIVE" } }),
    db.user.count({ where: { tenantId, status: "ACTIVE" } }),
    db.student.count({ where: { tenantId, status: "ACTIVE" } }),
    db.staffProfile.count({ where: { tenantId, employmentStatus: "ACTIVE" } }),
    db.academicYear.count({ where: { tenantId, status: "ACTIVE", isActive: true } }),
    db.studentAttendanceRecord.count({
      where: {
        tenantId,
        attendanceDate: today,
        status: { not: "NOT_MARKED" }
      }
    }),
    db.staffAttendanceRecord.count({
      where: {
        tenantId,
        attendanceDate: today
      }
    }),
    db.staffAttendanceRecord.count({
      where: {
        tenantId,
        attendanceDate: today,
        checkInAt: { not: null }
      }
    }),
    db.attendanceSetting.count({
      where: {
        tenantId,
        OR: [
          { studentAttendanceWhatsAppEnabled: true },
          { staffMonthlySummaryWhatsAppEnabled: true }
        ]
      }
    }),
    db.whatsAppIntegrationSetting.count({ where: { tenantId, isEnabled: true } })
  ]);

  if (!school) return null;

  await writeAuditLog({
    ctx: administratorAuditContext(ctx),
    action: CAMPUS_CORE_AUDIT_EVENTS.ADMINISTRATOR_SCHOOL_DASHBOARD_OPENED,
    entityType: "Tenant",
    entityId: school.id,
    metadata: {
      schoolId: school.slug,
      route: "/administrator/schools/[tenantId]/dashboard"
    }
  }).catch(() => null);

  return {
    school,
    metrics: {
      institutions: school._count.institutions,
      branches: school._count.branches,
      activeBranches,
      users: school._count.users,
      activeUsers,
      students: school._count.students,
      activeStudents,
      staffProfiles: school._count.staffProfiles,
      activeStaff,
      activeAcademicYears,
      notificationOutboxItems: school._count.notificationOutboxItems
    },
    todayAttendance: {
      date: toDateOnlyString(today),
      studentRecordsMarked: studentAttendanceMarkedToday,
      staffRecords: staffAttendanceRecordedToday,
      staffCheckedIn: staffCheckedInToday
    },
    notifications: {
      attendanceNotificationBranches,
      enabledWhatsAppProviders
    }
  };
}

export async function listSchoolsForAdministrator(
  ctx: TenantContext,
  filters: { search?: string; status?: "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "ALL" } = {}
) {
  await requirePlatformPermission(ctx, "platform.school.view");
  const search = filters.search?.trim();
  return db.tenant.findMany({
    where: {
      ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search.toLowerCase(), mode: "insensitive" } },
              { supportEmail: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      supportEmail: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { institutions: true, branches: true, users: true } }
    },
    orderBy: { name: "asc" },
    take: 100
  });
}

export async function getSchoolDependencySummary(tenantId: string): Promise<SchoolDependencySummary> {
  const [
    institutions,
    branches,
    users,
    students,
    staffProfiles,
    studentAttendanceRecords,
    staffAttendanceRecords,
    auditLogs,
    notificationOutboxItems,
    roles
  ] = await Promise.all([
    db.institution.count({ where: { tenantId } }),
    db.branch.count({ where: { tenantId } }),
    db.user.count({ where: { tenantId } }),
    db.student.count({ where: { tenantId } }),
    db.staffProfile.count({ where: { tenantId } }),
    db.studentAttendanceRecord.count({ where: { tenantId } }),
    db.staffAttendanceRecord.count({ where: { tenantId } }),
    db.auditLog.count({ where: { tenantId } }),
    db.notificationOutbox.count({ where: { tenantId } }),
    db.role.count({ where: { tenantId } })
  ]);
  return {
    institutions,
    branches,
    users,
    students,
    staffProfiles,
    studentAttendanceRecords,
    staffAttendanceRecords,
    auditLogs,
    notificationOutboxItems,
    roles
  };
}

export async function getSchoolByIdForAdministrator(ctx: TenantContext, tenantId: string) {
  await requirePlatformPermission(ctx, "platform.school.view");
  const [school, dependencySummary] = await Promise.all([
    db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        legalName: true,
        supportEmail: true,
        phone: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        institutions: {
          select: { id: true, name: true, displayName: true, code: true, status: true, logoUrl: true },
          orderBy: { name: "asc" },
          take: 10
        },
        branches: {
          select: { id: true, name: true, code: true, status: true },
          orderBy: { name: "asc" },
          take: 10
        },
        users: {
          where: {
            status: { not: "DEACTIVATED" },
            roleAssignments: { some: { isActive: true, role: { code: { in: ["PRINCIPAL", "ADMIN"] } } } }
          },
          select: { id: true, email: true, displayName: true, firstName: true, lastName: true, status: true },
          orderBy: { firstName: "asc" },
          take: 10
        }
      }
    }),
    getSchoolDependencySummary(tenantId)
  ]);
  if (!school) return null;
  return { ...school, dependencySummary };
}

export async function createSchool(ctx: TenantContext, input: z.infer<typeof createSchoolSchema>) {
  await requirePlatformPermission(ctx, "platform.school.create");
  await assertSchoolIdAvailable(db, input.schoolId);

  return db.$transaction(async (tx) => {
    await assertSchoolIdAvailable(tx, input.schoolId);
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.schoolId,
        legalName: input.name,
        supportEmail: input.supportEmail,
        status: input.status
      }
    });
    await tx.tenantSettings.create({ data: { tenantId: tenant.id, brandName: input.institutionDisplayName ?? input.name, createdById: ctx.userId } });
    const institution = await tx.institution.create({
      data: {
        tenantId: tenant.id,
        name: input.name,
        displayName: input.institutionDisplayName,
        code: "MAIN",
        status: "ACTIVE",
        createdById: ctx.userId
      }
    });
    const branch = await tx.branch.create({
      data: {
        tenantId: tenant.id,
        institutionId: institution.id,
        name: "Main Branch",
        code: "MAIN",
        status: "ACTIVE",
        createdById: ctx.userId
      }
    });
    await tx.attendanceSetting.create({ data: { tenantId: tenant.id, branchId: branch.id, createdById: ctx.userId } });
    await ensureDefaultRolesForTenant(tx, tenant.id, ctx.userId);

    if (input.principalFirstName && input.principalEmail && input.principalInitialPassword) {
      const principalRole = await tx.role.findUnique({
        where: { tenantId_code: { tenantId: tenant.id, code: "PRINCIPAL" } },
        select: { id: true }
      });
      if (!principalRole) throw new AppError("PRINCIPAL_ROLE_NOT_FOUND", "PRINCIPAL_ROLE_NOT_FOUND", 500);
      const principal = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.principalEmail,
          firstName: input.principalFirstName,
          lastName: input.principalLastName,
          displayName: [input.principalFirstName, input.principalLastName].filter(Boolean).join(" "),
          userType: "STAFF",
          status: "ACTIVE",
          activatedAt: new Date(),
          createdById: ctx.userId
        }
      });
      await tx.passwordCredential.create({
        data: {
          userId: principal.id,
          passwordHash: await hashPassword(input.principalInitialPassword),
          mustChange: true
        }
      });
      await tx.userRoleAssignment.create({
        data: { tenantId: tenant.id, userId: principal.id, roleId: principalRole.id, assignedById: ctx.userId }
      });
      await tx.userBranchAccess.create({
        data: { tenantId: tenant.id, userId: principal.id, branchId: branch.id, isPrimary: true, grantedById: ctx.userId }
      });
      await writeAuditLog({
        ctx: administratorAuditContext(ctx),
        action: CAMPUS_CORE_AUDIT_EVENTS.PRINCIPAL_CREATED,
        entityType: "User",
        entityId: principal.id,
        metadata: { targetSchoolId: input.schoolId, principalEmail: principal.email, initialPasswordSet: true }
      }, tx);
    }

    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_CREATED,
      entityType: "Tenant",
      entityId: tenant.id,
      after: { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status },
      metadata: { schoolId: tenant.slug, defaultInstitutionCreated: true, defaultBranchCreated: true }
    }, tx);
    return tenant;
  });
}

export async function updateSchool(ctx: TenantContext, input: z.infer<typeof updateSchoolSchema>) {
  await requirePlatformPermission(ctx, "platform.school.update");
  return db.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!before) throw notFound("SCHOOL_NOT_FOUND");
    const after = await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        name: input.name,
        legalName: input.legalName,
        supportEmail: input.supportEmail,
        status: input.status
      }
    });

    if (input.institutionDisplayName !== undefined || input.institutionLogoUrl !== undefined) {
      const primaryInstitution = await tx.institution.findFirst({
        where: { tenantId: input.tenantId, status: { not: "ARCHIVED" } },
        orderBy: { name: "asc" },
        select: { id: true }
      });
      if (primaryInstitution) {
        await tx.institution.update({
          where: { id: primaryInstitution.id },
          data: {
            displayName: input.institutionDisplayName,
            logoUrl: input.institutionLogoUrl,
            updatedById: ctx.userId
          }
        });
      }
    }

    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_UPDATED,
      entityType: "Tenant",
      entityId: after.id,
      before: { id: before.id, name: before.name, slug: before.slug, status: before.status, supportEmail: before.supportEmail },
      after: { id: after.id, name: after.name, slug: after.slug, status: after.status, supportEmail: after.supportEmail }
    }, tx);
    return after;
  });
}

export async function updateSchoolId(ctx: TenantContext, input: z.infer<typeof updateSchoolIdSchema>) {
  await requirePlatformPermission(ctx, "platform.school.update_school_id");
  return db.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!before) throw notFound("SCHOOL_NOT_FOUND");
    if (before.slug !== input.currentSchoolId) throw new AppError("CURRENT_SCHOOL_ID_MISMATCH", "CURRENT_SCHOOL_ID_MISMATCH", 400);
    await assertSchoolIdAvailable(tx, input.newSchoolId, input.tenantId);
    const after = await tx.tenant.update({
      where: { id: input.tenantId },
      data: { slug: input.newSchoolId }
    });
    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_ID_UPDATED,
      entityType: "Tenant",
      entityId: after.id,
      before: { schoolId: before.slug },
      after: { schoolId: after.slug },
      metadata: { oldSchoolId: before.slug, newSchoolId: after.slug, loginUrlChanged: true }
    }, tx);
    return after;
  });
}

export async function deactivateSchool(ctx: TenantContext, input: z.infer<typeof deactivateSchoolSchema>) {
  await requirePlatformPermission(ctx, "platform.school.deactivate");
  if (input.tenantId === ctx.tenantId) throw new AppError("SCHOOL_SELF_DEACTIVATE_BLOCKED", "SCHOOL_SELF_DEACTIVATE_BLOCKED", 400);
  return db.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!before) throw notFound("SCHOOL_NOT_FOUND");
    const after = await tx.tenant.update({ where: { id: input.tenantId }, data: { status: "SUSPENDED" } });
    await tx.session.updateMany({ where: { tenantId: input.tenantId, revokedAt: null }, data: { revokedAt: new Date() } });
    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_DEACTIVATED,
      entityType: "Tenant",
      entityId: after.id,
      before: { status: before.status },
      after: { status: after.status },
      metadata: { schoolId: after.slug, sessionsRevoked: true }
    }, tx);
    return after;
  });
}

export async function reactivateSchool(ctx: TenantContext, input: z.infer<typeof reactivateSchoolSchema>) {
  await requirePlatformPermission(ctx, "platform.school.deactivate");
  return db.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!before) throw notFound("SCHOOL_NOT_FOUND");
    const after = await tx.tenant.update({ where: { id: input.tenantId }, data: { status: "ACTIVE" } });
    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_REACTIVATED,
      entityType: "Tenant",
      entityId: after.id,
      before: { status: before.status },
      after: { status: after.status },
      metadata: { schoolId: after.slug }
    }, tx);
    return after;
  });
}

export async function deleteSchoolIfSafe(ctx: TenantContext, input: z.infer<typeof deleteSchoolSchema>) {
  await requirePlatformPermission(ctx, "platform.school.delete");
  if (input.tenantId === ctx.tenantId) throw new AppError("SCHOOL_SELF_DELETE_BLOCKED", "SCHOOL_SELF_DELETE_BLOCKED", 400);
  const school = await db.tenant.findUnique({ where: { id: input.tenantId }, select: { id: true, slug: true } });
  if (!school) throw notFound("SCHOOL_NOT_FOUND");
  const dependencySummary = await getSchoolDependencySummary(input.tenantId);
  if (hasDependencies(dependencySummary)) {
    await writeAuditLog({
      ctx: administratorAuditContext(ctx),
      action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_DELETE_BLOCKED,
      entityType: "Tenant",
      entityId: school.id,
      metadata: { schoolId: school.slug, dependencySummary }
    }).catch(() => null);
    throw new AppError("SCHOOL_DELETE_BLOCKED_BY_DEPENDENCIES", "SCHOOL_DELETE_BLOCKED_BY_DEPENDENCIES", 409);
  }

  await db.tenant.delete({ where: { id: input.tenantId } });
  await writeAuditLog({
    ctx: administratorAuditContext(ctx),
    action: CAMPUS_CORE_AUDIT_EVENTS.SCHOOL_DELETED,
    entityType: "Tenant",
    entityId: school.id,
    metadata: { schoolId: school.slug }
  }).catch(() => null);
  return { tenantId: input.tenantId };
}
