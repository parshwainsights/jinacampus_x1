import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { PermissionCode } from "@/lib/rbac/permissions";
import {
  getVisibleStaffboardModuleCards,
  staffboardModuleCards,
  staffboardRoutes,
  staffCategoryCards,
  staffProfileListConfig
} from "@/modules/staffboard-lite/ui-config";

const routeFiles = [
  "src/app/(dashboard)/staffboard/page.tsx",
  "src/app/(dashboard)/staffboard/staff/page.tsx",
  "src/app/(dashboard)/staffboard/categories/page.tsx",
  "src/app/(dashboard)/staffboard/attendance/page.tsx",
  "src/app/(dashboard)/staffboard/attendance/qr/page.tsx",
  "src/app/(dashboard)/staffboard/attendance/scan/page.tsx",
  "src/app/(dashboard)/staffboard/attendance/reports/page.tsx"
] as const;

describe("StaffBoard Lite UI route config", () => {
  it("defines the StaffBoard route map", () => {
    expect(staffboardRoutes).toEqual({
      overview: "/staffboard",
      staff: "/staffboard/staff",
      categories: "/staffboard/categories",
      attendance: "/staffboard/attendance",
      qr: "/staffboard/attendance/qr",
      scan: "/staffboard/attendance/scan",
      reports: "/staffboard/attendance/reports"
    });
  });

  it("creates the required StaffBoard route files", () => {
    for (const file of routeFiles) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
  });

  it("defines overview cards without stale coming-soon placeholders", () => {
    expect(staffboardModuleCards.map((card) => card.href)).toEqual([
      "/staffboard/staff",
      "/staffboard/categories",
      "/staffboard/attendance/qr",
      "/staffboard/attendance/scan",
      "/staffboard/attendance",
      "/staffboard/attendance/reports"
    ]);
    expect(staffboardModuleCards.map((card) => card.key)).toContain("attendance");
    expect(staffboardModuleCards.map((card) => card.title)).toContain("Staff QR Display");
    expect(staffboardModuleCards.filter((card) => card.status === "coming-soon")).toEqual([]);
  });

  it("filters overview cards to StaffBoard permissions", () => {
    const staffPermissions = new Set<PermissionCode>(["staffboard.attendance.self_scan"]);

    expect(getVisibleStaffboardModuleCards(staffPermissions).map((card) => card.href)).toEqual([
      "/staffboard/attendance/scan"
    ]);
  });

  it("defines the staff profile list columns", () => {
    expect(staffProfileListConfig.columns).toEqual([
      "Employee Code",
      "Staff Name",
      "Staff Type",
      "Designation",
      "Department",
      "Branch",
      "Employment Status",
      "App Access",
      "Updated At",
      "Actions"
    ]);
  });

  it("defines all StaffBoard Lite categories without out-of-scope categories", () => {
    expect(staffCategoryCards.map((category) => category.value)).toEqual([
      "TEACHER",
      "ADMIN",
      "ACCOUNTANT",
      "LIBRARIAN",
      "DRIVER",
      "HELPER",
      "SECURITY",
      "PEON",
      "CLEANING_STAFF",
      "MANAGEMENT",
      "OTHER"
    ]);
    expect(staffCategoryCards.map((category) => category.value).join(" ")).not.toMatch(/PAYROLL|LEAVE|APPRAISAL/i);
  });

  it("adds StaffBoard navigation without payroll, leave, or appraisal links", () => {
    const navigationSource = readFileSync(resolve(process.cwd(), "src/components/app-shell/navigation.ts"), "utf8");

    expect(navigationSource).toContain("StaffBoard Lite");
    expect(navigationSource).toContain("Categories");
    expect(navigationSource).toContain("Staff Attendance");
    expect(navigationSource).toContain("QR Display");
    expect(navigationSource).toContain("Scan QR");
    expect(navigationSource).toContain("Staff Reports");
    expect(navigationSource).toContain("/staffboard/staff");
    expect(navigationSource).toContain("/staffboard/categories");
    expect(navigationSource).toContain("/staffboard/attendance/qr");
    expect(navigationSource).toContain("/staffboard/attendance/scan");
    expect(navigationSource).toContain("/staffboard/attendance/reports");
    expect(navigationSource).not.toMatch(/payroll|leave|appraisal/i);
  });

  it("protects StaffBoard routes through middleware", () => {
    const middlewareSource = readFileSync(resolve(process.cwd(), "middleware.ts"), "utf8");

    expect(middlewareSource).toContain("\"/staffboard\"");
    expect(middlewareSource).toContain("\"/staffboard/:path*\"");
  });
});
