import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    tenant: {
      findUnique: vi.fn()
    }
  },
  getEffectivePermissions: vi.fn(),
  writeAuditLog: vi.fn(),
  hashPassword: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({
  getEffectivePermissions: mocks.getEffectivePermissions
}));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: mocks.hashPassword }));

import {
  getSchoolByIdForAdministrator,
  getSchoolDependencySummary
} from "@/modules/campus-core/administrator-services";
import type { TenantContext } from "@/lib/tenant/context";

const dependencyCounts = {
  institutions: 1,
  branches: 2,
  users: 3,
  students: 4,
  staffProfiles: 5,
  studentAttendanceRecords: 6,
  staffAttendanceRecords: 7,
  auditLogs: 8,
  notificationOutboxItems: 9,
  roles: 10
};

const administratorContext: TenantContext = {
  tenantId: "platform-tenant-id",
  userId: "platform-admin-id",
  userEmail: "administrator@example.test",
  userType: "OWNER",
  activeBranchId: null,
  accessibleBranchIds: [],
  activeAcademicYearId: null,
  roleCodes: ["ADMINISTRATOR"]
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEffectivePermissions.mockResolvedValue(new Set(["platform.school.view"]));
});

describe("administrator school detail query", () => {
  it("loads school detail and dependency counts through one tenant query", async () => {
    mocks.db.tenant.findUnique.mockResolvedValue({
      id: "school-id",
      name: "Example School",
      slug: "example-school",
      status: "ACTIVE",
      legalName: null,
      supportEmail: null,
      phone: null,
      website: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      institutions: [],
      branches: [],
      users: [],
      _count: dependencyCounts
    });

    const school = await getSchoolByIdForAdministrator(administratorContext, "school-id");

    expect(mocks.db.tenant.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.db.tenant.findUnique.mock.calls[0][0]).toEqual(expect.objectContaining({
      where: { id: "school-id" },
      select: expect.objectContaining({
        _count: {
          select: {
            institutions: true,
            branches: true,
            users: true,
            students: true,
            staffProfiles: true,
            studentAttendanceRecords: true,
            staffAttendanceRecords: true,
            auditLogs: true,
            notificationOutboxItems: true,
            roles: true
          }
        }
      })
    }));
    expect(school).toEqual(expect.objectContaining({
      id: "school-id",
      dependencySummary: dependencyCounts
    }));
    expect(school).not.toHaveProperty("_count");
  });

  it("uses the same bounded relation-count query for lifecycle checks", async () => {
    mocks.db.tenant.findUnique.mockResolvedValue({ _count: dependencyCounts });

    await expect(getSchoolDependencySummary("school-id")).resolves.toEqual(dependencyCounts);
    expect(mocks.db.tenant.findUnique).toHaveBeenCalledTimes(1);
  });

  it("does not hide infrastructure failures behind a permission message", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/administrator/schools/[tenantId]/page.tsx"),
      "utf8"
    );

    expect(page).toContain("if (!(error instanceof AppError) || error.status !== 403) throw error;");
  });
});
