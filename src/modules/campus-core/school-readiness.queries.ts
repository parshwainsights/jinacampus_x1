import { db } from "@/lib/db";
import { getWebAuthnConfig } from "@/lib/auth/webauthn-config";
import { requirePermission } from "@/lib/rbac/require-permission";
import { SCHOOL_OPERATIONAL_ROLE_CODES } from "@/lib/rbac/roles";
import type { TenantContext } from "@/lib/tenant/context";
import {
  buildSchoolReadinessReport,
  type SchoolReadinessSnapshot
} from "@/modules/campus-core/school-readiness";

const STAFF_LOGIN_ROLE_CODES = ["OFFICE_STAFF", "TEACHER", "STAFF"] as const;

function roleAssignmentDateScope(now: Date) {
  return {
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
    ]
  };
}

export async function getSchoolReadinessReport(ctx: TenantContext) {
  await requirePermission({
    ctx,
    permission: "campuscore.settings.manage",
    branchId: ctx.activeBranchId
  });

  const branches = await db.branch.findMany({
    where: {
      tenantId: ctx.tenantId,
      id: { in: ctx.accessibleBranchIds },
      status: "ACTIVE"
    },
    select: {
      id: true,
      institutionId: true,
      institution: {
        select: {
          id: true,
          status: true,
          displayName: true,
          logoUrl: true
        }
      }
    },
    orderBy: { name: "asc" },
    take: 100
  });
  const branchIds = branches.map((branch) => branch.id);
  const activeInstitutions = Array.from(new Map(
    branches
      .filter((branch) => branch.institution.status === "ACTIVE")
      .map((branch) => [branch.institution.id, branch.institution])
  ).values());
  const institutionIds = activeInstitutions.map((institution) => institution.id);

  const activeAcademicYear = institutionIds.length > 0
    ? await db.academicYear.findFirst({
      where: {
        tenantId: ctx.tenantId,
        institutionId: { in: institutionIds },
        status: "ACTIVE",
        isActive: true
      },
      select: { id: true }
    })
    : null;

  const roles = await db.role.findMany({
    where: {
      tenantId: ctx.tenantId,
      code: { in: [...SCHOOL_OPERATIONAL_ROLE_CODES] },
      isActive: true
    },
    select: { code: true }
  });
  const activeRoleCodes = new Set(roles.map((role) => role.code));
  const missingRoleCodes = SCHOOL_OPERATIONAL_ROLE_CODES.filter(
    (roleCode) => !activeRoleCodes.has(roleCode)
  );
  const now = new Date();

  const activePrincipalCount = branchIds.length > 0
    ? await db.userRoleAssignment.count({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
        ...roleAssignmentDateScope(now),
        role: { tenantId: ctx.tenantId, code: "PRINCIPAL", isActive: true },
        user: {
          tenantId: ctx.tenantId,
          status: "ACTIVE",
          branchAccesses: {
            some: {
              tenantId: ctx.tenantId,
              branchId: { in: branchIds },
              isActive: true
            }
          }
        }
      }
    })
    : 0;

  const activeStaffCount = await db.staffProfile.count({
    where: {
      tenantId: ctx.tenantId,
      branchId: { in: branchIds },
      employmentStatus: "ACTIVE"
    }
  });
  const unlinkedActiveStaffCount = await db.staffProfile.count({
    where: {
      tenantId: ctx.tenantId,
      branchId: { in: branchIds },
      employmentStatus: "ACTIVE",
      userId: null
    }
  });
  const disabledLinkedStaffCount = await db.staffProfile.count({
    where: {
      tenantId: ctx.tenantId,
      branchId: { in: branchIds },
      employmentStatus: "ACTIVE",
      user: { is: { tenantId: ctx.tenantId, status: { not: "ACTIVE" } } }
    }
  });
  const operationalUsersWithoutStaffProfileCount = await db.user.count({
    where: {
      tenantId: ctx.tenantId,
      status: "ACTIVE",
      staffProfile: { is: null },
      branchAccesses: {
        some: {
          tenantId: ctx.tenantId,
          branchId: { in: branchIds },
          isActive: true
        }
      },
      roleAssignments: {
        some: {
          tenantId: ctx.tenantId,
          isActive: true,
          ...roleAssignmentDateScope(now),
          role: {
            tenantId: ctx.tenantId,
            code: { in: [...STAFF_LOGIN_ROLE_CODES] },
            isActive: true
          }
        }
      }
    }
  });
  const mandatoryPasswordChangeCount = await db.user.count({
    where: {
      tenantId: ctx.tenantId,
      status: "ACTIVE",
      branchAccesses: {
        some: {
          tenantId: ctx.tenantId,
          branchId: { in: branchIds },
          isActive: true
        }
      },
      passwordCredential: { is: { mustChange: true } }
    }
  });

  const classSectionScope = {
    tenantId: ctx.tenantId,
    branchId: { in: branchIds },
    ...(activeAcademicYear ? { academicYearId: activeAcademicYear.id } : {}),
    status: "ACTIVE" as const
  };
  const activeClassSectionCount = activeAcademicYear
    ? await db.classSection.count({ where: classSectionScope })
    : 0;
  const unassignedClassSectionCount = activeAcademicYear
    ? await db.classSection.count({
      where: { ...classSectionScope, classTeacherUserId: null }
    })
    : 0;
  const activeEnrollmentCount = activeAcademicYear
    ? await db.enrollment.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: { in: branchIds },
        academicYearId: activeAcademicYear.id,
        status: "ACTIVE"
      }
    })
    : 0;

  const attendanceSettings = await db.attendanceSetting.findMany({
    where: {
      tenantId: ctx.tenantId,
      branchId: { in: branchIds }
    },
    select: {
      branchId: true,
      staffQrAttendanceEnabled: true
    }
  });

  let passkeyConfiguration: SchoolReadinessSnapshot["passkeyConfiguration"] = "invalid";
  try {
    const webAuthn = getWebAuthnConfig();
    passkeyConfiguration = webAuthn.origin.startsWith("https://")
      ? "https-ready"
      : "local-only";
  } catch {
    passkeyConfiguration = "invalid";
  }

  return buildSchoolReadinessReport({
    activeInstitutionCount: activeInstitutions.length,
    brandedInstitutionCount: activeInstitutions.filter(
      (institution) => Boolean(institution.displayName || institution.logoUrl)
    ).length,
    activeBranchCount: branchIds.length,
    hasActiveAcademicYear: Boolean(activeAcademicYear),
    missingRoleCodes: [...missingRoleCodes],
    activePrincipalCount,
    activeStaffCount,
    unlinkedActiveStaffCount,
    disabledLinkedStaffCount,
    operationalUsersWithoutStaffProfileCount,
    mandatoryPasswordChangeCount,
    activeClassSectionCount,
    unassignedClassSectionCount,
    activeEnrollmentCount,
    configuredAttendanceBranchCount: attendanceSettings.length,
    qrEnabledBranchCount: attendanceSettings.filter(
      (setting) => setting.staffQrAttendanceEnabled
    ).length,
    passkeyConfiguration
  });
}
