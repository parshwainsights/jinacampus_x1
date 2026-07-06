import type { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DEMO_BRANCH, DEMO_TENANT } from "../../prisma/seeds/demo-data.seed";
import {
  assertDemoQaResetAllowed,
  DEMO_QA_RESET_EMPLOYEE_CODES,
  demoQaResetStaffProfilesAreSeeded,
  resetDemoQaState
} from "../../prisma/seeds/demo-qa-reset.seed";

function createMockDb() {
  const fns = {
    tenantFindUnique: vi.fn().mockResolvedValue({ id: "tenant-demo", slug: DEMO_TENANT.slug }),
    branchFindFirst: vi.fn().mockResolvedValue({ id: "branch-main", code: DEMO_BRANCH.code }),
    staffProfileFindMany: vi.fn().mockResolvedValue([
      { id: "staff-teacher", employeeCode: "JD-TCH-001" },
      { id: "staff-staff", employeeCode: "JD-STF-001" }
    ]),
    staffAttendanceRecordDeleteMany: vi.fn().mockResolvedValue({ count: 2 })
  };
  const db = {
    tenant: { findUnique: fns.tenantFindUnique },
    branch: { findFirst: fns.branchFindFirst },
    staffProfile: { findMany: fns.staffProfileFindMany },
    staffAttendanceRecord: { deleteMany: fns.staffAttendanceRecordDeleteMany }
  } as unknown as PrismaClient;

  return { db, fns };
}

describe("Phase 10.2 demo QA reset", () => {
  it("is explicitly demo-only and blocks production mode", () => {
    expect(DEMO_TENANT.slug).toBe("jinacampus-demo");
    expect(DEMO_QA_RESET_EMPLOYEE_CODES).toEqual(["JD-TCH-001", "JD-STF-001"]);
    expect(demoQaResetStaffProfilesAreSeeded()).toBe(true);
    expect(() => assertDemoQaResetAllowed("production")).toThrow("production");
  });

  it("looks up the demo tenant before any reset write", async () => {
    const { db, fns } = createMockDb();
    fns.tenantFindUnique.mockResolvedValueOnce(null);

    await expect(resetDemoQaState(db, { nodeEnv: "development" })).rejects.toThrow("jinacampus-demo");

    expect(fns.tenantFindUnique).toHaveBeenCalledWith({
      where: { slug: "jinacampus-demo" },
      select: { id: true, slug: true }
    });
    expect(fns.staffAttendanceRecordDeleteMany).not.toHaveBeenCalled();
  });

  it("scopes staff lookup and attendance reset by demo tenant, branch, staff IDs, and date", async () => {
    const { db, fns } = createMockDb();
    const attendanceDate = new Date(Date.UTC(2026, 4, 16));

    const summary = await resetDemoQaState(db, { attendanceDate, nodeEnv: "development" });

    expect(fns.branchFindFirst).toHaveBeenCalledWith({
      where: { tenantId: "tenant-demo", code: "MAIN", status: { not: "ARCHIVED" } },
      select: { id: true, code: true }
    });
    expect(fns.staffProfileFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-demo",
        branchId: "branch-main",
        employeeCode: { in: ["JD-TCH-001", "JD-STF-001"] },
        employmentStatus: "ACTIVE"
      },
      select: { id: true, employeeCode: true }
    });
    expect(fns.staffAttendanceRecordDeleteMany).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-demo",
        branchId: "branch-main",
        staffId: { in: ["staff-teacher", "staff-staff"] },
        attendanceDate
      }
    });
    expect(summary).toMatchObject({
      tenantSlug: "jinacampus-demo",
      branchCode: "MAIN",
      attendanceDate: "2026-05-16",
      matchedStaffProfiles: 2,
      deletedStaffAttendanceRecords: 2
    });
  });

  it("does not perform a broad delete when demo staff profiles are missing", async () => {
    const { db, fns } = createMockDb();
    fns.staffProfileFindMany.mockResolvedValueOnce([]);

    const summary = await resetDemoQaState(db, { nodeEnv: "development" });

    expect(fns.staffAttendanceRecordDeleteMany).not.toHaveBeenCalled();
    expect(summary.matchedStaffProfiles).toBe(0);
    expect(summary.deletedStaffAttendanceRecords).toBe(0);
  });

  it("does not include broad destructive operations or QR secrets", () => {
    const source = readFileSync(join(process.cwd(), "prisma/seeds/demo-qa-reset.seed.ts"), "utf8");
    const cliSource = readFileSync(join(process.cwd(), "prisma/demo-qa-reset.ts"), "utf8");

    expect(source).toContain("staffAttendanceRecord.deleteMany");
    expect(source).not.toMatch(/tenant\.deleteMany|user\.deleteMany|role\.deleteMany|permission\.deleteMany/i);
    expect(source).not.toMatch(/studentAttendanceRecord\.deleteMany|staffProfile\.deleteMany/i);
    expect(`${source}\n${cliSource}`).not.toMatch(/rawToken|tokenHash|qrPayload/i);
  });
});
