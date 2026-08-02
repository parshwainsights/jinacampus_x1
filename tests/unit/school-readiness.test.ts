import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TenantContext } from "@/lib/tenant/context";
import { buildSchoolReadinessReport } from "@/modules/campus-core/school-readiness";
import { getSchoolReadinessReport } from "@/modules/campus-core/school-readiness.queries";

const mocks = vi.hoisted(() => ({
  db: {
    academicYear: { findFirst: vi.fn() },
    attendanceSetting: { findMany: vi.fn() },
    branch: { findMany: vi.fn() },
    classSection: { count: vi.fn() },
    enrollment: { count: vi.fn() },
    role: { findMany: vi.fn() },
    staffProfile: { count: vi.fn() },
    user: { count: vi.fn() },
    userRoleAssignment: { count: vi.fn() }
  },
  getWebAuthnConfig: vi.fn(),
  requirePermission: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/auth/webauthn-config", () => ({
  getWebAuthnConfig: mocks.getWebAuthnConfig
}));
vi.mock("@/lib/rbac/require-permission", () => ({
  requirePermission: mocks.requirePermission
}));

const tenantId = "00000000-0000-0000-0000-000000000001";
const branchId = "00000000-0000-0000-0000-000000000002";
const institutionId = "00000000-0000-0000-0000-000000000003";
const academicYearId = "00000000-0000-0000-0000-000000000004";

const ctx: TenantContext = {
  tenantId,
  userId: "00000000-0000-0000-0000-000000000005",
  userEmail: "principal@example.test",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: academicYearId,
  roleCodes: ["PRINCIPAL"]
};

beforeEach(() => {
  for (const model of Object.values(mocks.db)) {
    for (const method of Object.values(model)) method.mockReset();
  }
  mocks.getWebAuthnConfig.mockReset();
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
});

describe("school readiness", () => {
  it("returns a ready report from tenant-scoped school setup data", async () => {
    mocks.db.branch.findMany.mockResolvedValue([{
      id: branchId,
      institutionId,
      institution: {
        id: institutionId,
        status: "ACTIVE",
        displayName: "Pilot School",
        logoUrl: null
      }
    }]);
    mocks.db.academicYear.findFirst.mockResolvedValue({ id: academicYearId });
    mocks.db.role.findMany.mockResolvedValue([
      { code: "PRINCIPAL" },
      { code: "OFFICE_STAFF" },
      { code: "TEACHER" },
      { code: "STAFF" }
    ]);
    mocks.db.userRoleAssignment.count.mockResolvedValue(1);
    mocks.db.staffProfile.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mocks.db.user.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mocks.db.classSection.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    mocks.db.enrollment.count.mockResolvedValue(24);
    mocks.db.attendanceSetting.findMany.mockResolvedValue([{
      branchId,
      staffQrAttendanceEnabled: true
    }]);
    mocks.getWebAuthnConfig.mockReturnValue({
      origin: "https://school.example.test",
      rpID: "school.example.test",
      rpName: "JinaCampus"
    });

    const report = await getSchoolReadinessReport(ctx);

    expect(report.status).toBe("ready");
    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "campuscore.settings.manage",
      branchId
    });
    expect(mocks.db.branch.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId, id: { in: [branchId] }, status: "ACTIVE" }
    }));
    expect(mocks.db.academicYear.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId, institutionId: { in: [institutionId] } })
    }));
    expect(mocks.db.staffProfile.count.mock.calls.every(
      ([argument]) => argument.where.tenantId === tenantId
    )).toBe(true);
    expect(mocks.db.user.count.mock.calls.every(
      ([argument]) => argument.where.tenantId === tenantId
    )).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(
      /tenantId|branchId|institutionId|passwordHash|tokenHash|DATABASE_URL|WEBAUTHN_ORIGIN/
    );
  });

  it("blocks broken account alignment while reporting incomplete optional setup as warnings", () => {
    const report = buildSchoolReadinessReport({
      activeInstitutionCount: 0,
      brandedInstitutionCount: 0,
      activeBranchCount: 0,
      hasActiveAcademicYear: false,
      missingRoleCodes: ["TEACHER", "STAFF"],
      activePrincipalCount: 0,
      activeStaffCount: 1,
      unlinkedActiveStaffCount: 1,
      disabledLinkedStaffCount: 0,
      operationalUsersWithoutStaffProfileCount: 1,
      mandatoryPasswordChangeCount: 1,
      activeClassSectionCount: 1,
      unassignedClassSectionCount: 1,
      activeEnrollmentCount: 0,
      configuredAttendanceBranchCount: 0,
      qrEnabledBranchCount: 0,
      passkeyConfiguration: "invalid"
    });

    expect(report.status).toBe("blocked");
    expect(report.blockedCount).toBeGreaterThan(0);
    expect(report.warningCount).toBe(2);
    expect(report.checks.find((item) => item.id === "staff-access")?.status).toBe("blocked");
    expect(report.checks.find((item) => item.id === "class-sections")?.status).toBe("warning");
    expect(report.checks.find((item) => item.id === "passkeys")?.status).toBe("blocked");
  });

  it("does not require every active StaffProfile to have a login account", () => {
    const report = buildSchoolReadinessReport({
      activeInstitutionCount: 1,
      brandedInstitutionCount: 1,
      activeBranchCount: 1,
      hasActiveAcademicYear: true,
      missingRoleCodes: [],
      activePrincipalCount: 1,
      activeStaffCount: 8,
      unlinkedActiveStaffCount: 5,
      disabledLinkedStaffCount: 0,
      operationalUsersWithoutStaffProfileCount: 0,
      mandatoryPasswordChangeCount: 0,
      activeClassSectionCount: 2,
      unassignedClassSectionCount: 1,
      activeEnrollmentCount: 12,
      configuredAttendanceBranchCount: 1,
      qrEnabledBranchCount: 1,
      passkeyConfiguration: "https-ready"
    });

    expect(report.status).toBe("warning");
    expect(report.blockedCount).toBe(0);
    expect(report.checks.find((item) => item.id === "staff-access")).toMatchObject({
      status: "warning"
    });
    expect(report.checks.find((item) => item.id === "class-sections")).toMatchObject({
      status: "warning"
    });
  });

  it("treats a local-only passkey origin as an explicit deployment warning", () => {
    const report = buildSchoolReadinessReport({
      activeInstitutionCount: 1,
      brandedInstitutionCount: 1,
      activeBranchCount: 1,
      hasActiveAcademicYear: true,
      missingRoleCodes: [],
      activePrincipalCount: 1,
      activeStaffCount: 2,
      unlinkedActiveStaffCount: 0,
      disabledLinkedStaffCount: 0,
      operationalUsersWithoutStaffProfileCount: 0,
      mandatoryPasswordChangeCount: 0,
      activeClassSectionCount: 1,
      unassignedClassSectionCount: 0,
      activeEnrollmentCount: 1,
      configuredAttendanceBranchCount: 1,
      qrEnabledBranchCount: 1,
      passkeyConfiguration: "local-only"
    });

    expect(report.status).toBe("warning");
    expect(report.checks.find((item) => item.id === "passkeys")).toMatchObject({
      status: "warning"
    });
  });
});
