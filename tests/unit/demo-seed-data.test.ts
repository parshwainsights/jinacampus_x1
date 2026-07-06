import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_BRANCH,
  DEMO_CLASSES,
  DEMO_CLASS_SECTIONS,
  DEMO_STAFF_PASSWORD,
  DEMO_STAFF_ATTENDANCE_TODAY,
  DEMO_STAFF_PROFILES,
  DEMO_STUDENTS,
  DEMO_TENANT,
  DEMO_TODAY_STUDENT_ATTENDANCE,
  DEMO_USER_PASSWORD,
  getDemoUserPassword,
  DEMO_USERS
} from "../../prisma/seeds/demo-data.seed";
import { DEFAULT_ROLE_PERMISSION_MAP } from "../../src/lib/rbac/roles";

describe("Phase 9.8 demo seed data", () => {
  it("defines the expected deterministic demo tenant and branch", () => {
    expect(DEMO_TENANT).toMatchObject({
      name: "JinaCampus Demo School",
      slug: "jinacampus-demo"
    });
    expect(DEMO_BRANCH).toMatchObject({ name: "Main Branch", code: "MAIN" });
  });

  it("defines active demo users for admin, principal, teacher, staff, and office flows with .test emails", () => {
    expect(DEMO_USERS.map((user) => user.key)).toEqual(["admin", "principal", "teacher", "staff", "office"]);
    expect(DEMO_USERS.every((user) => user.email.endsWith(".test"))).toBe(true);
    expect(DEMO_USERS.find((user) => user.key === "office")?.roleCodes).toEqual(["OFFICE_STAFF"]);
    expect(DEMO_USERS.find((user) => user.key === "office")?.roleCodes).not.toContain("ADMIN");
    expect(DEMO_USERS.some((user) => user.roleCodes.some((roleCode) => roleCode === "CLASS_TEACHER"))).toBe(true);
    expect(DEMO_USERS.some((user) => user.roleCodes.some((roleCode) => roleCode === "STAFF"))).toBe(true);
  });

  it("keeps demo login passwords local-only, code-defined, and env-overridable for staff QA", () => {
    const dataSource = readFileSync(join(process.cwd(), "prisma/seeds/demo-data.seed.ts"), "utf8");
    const seedSource = readFileSync(join(process.cwd(), "prisma/seeds/demo-tenant.seed.ts"), "utf8");

    expect(DEMO_USER_PASSWORD.length).toBeGreaterThanOrEqual(8);
    expect(DEMO_STAFF_PASSWORD.length).toBeGreaterThanOrEqual(8);
    expect(getDemoUserPassword("staff")).toBe(DEMO_STAFF_PASSWORD);
    expect(getDemoUserPassword("teacher")).toBe(DEMO_USER_PASSWORD);
    expect(dataSource).toContain("process.env.DEMO_STAFF_PASSWORD");
    expect(seedSource).toContain("hashPassword(getDemoUserPassword(demoUser.key))");
    expect(seedSource).not.toContain("passwordHash: DEMO_USER_PASSWORD");
  });

  it("keeps demo role permissions sufficient for attendance, QR, reports, and dashboard QA", () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP.ADMIN).toEqual(expect.arrayContaining([
      "campuscore.tenant.view",
      "academia.attendance.mark",
      "academia.attendance.correct",
      "academia.attendance.report",
      "staffboard.attendance.qr.generate",
      "staffboard.attendance.correct",
      "staffboard.attendance.report"
    ]));
    expect(DEFAULT_ROLE_PERMISSION_MAP.PRINCIPAL).toEqual(expect.arrayContaining([
      "campuscore.tenant.view",
      "academia.attendance.report",
      "staffboard.staff.view",
      "staffboard.attendance.qr.generate",
      "staffboard.attendance.correct",
      "staffboard.attendance.report"
    ]));
    expect(DEFAULT_ROLE_PERMISSION_MAP.CLASS_TEACHER).toEqual(expect.arrayContaining([
      "academia.attendance.mark",
      "academia.attendance.report",
      "staffboard.attendance.self_scan"
    ]));
    expect(DEFAULT_ROLE_PERMISSION_MAP.STAFF).toEqual(expect.arrayContaining(["staffboard.attendance.self_scan"]));
    expect(DEFAULT_ROLE_PERMISSION_MAP.OFFICE_STAFF).toEqual(expect.arrayContaining([
      "staffboard.attendance.qr.generate",
      "staffboard.attendance.correct",
      "staffboard.attendance.report"
    ]));
  });

  it("includes class sections, active students, and attendance patterns for reports", () => {
    expect(DEMO_CLASSES.map((item) => item.name)).toEqual(["Class 1", "Class 2", "Class 3"]);
    expect(DEMO_CLASS_SECTIONS.map((item) => item.displayName)).toEqual(["Class 1-A", "Class 2-A", "Class 3-A"]);
    expect(DEMO_STUDENTS).toHaveLength(18);
    expect(new Set(DEMO_STUDENTS.map((student) => student.classSectionKey))).toEqual(
      new Set(["class-1-a", "class-2-a", "class-3-a"])
    );
    expect(DEMO_TODAY_STUDENT_ATTENDANCE.flatMap((group) => group.statuses)).toEqual(expect.arrayContaining([
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY"
    ]));
  });

  it("includes staff profiles linked to login users and staff attendance statuses for reports", () => {
    const linkedUserKeys = DEMO_STAFF_PROFILES
      .map((profile) => ("userKey" in profile ? profile.userKey : null))
      .filter(Boolean);
    expect(linkedUserKeys).toEqual(expect.arrayContaining(["admin", "principal", "teacher", "staff", "office"]));
    expect(DEMO_STAFF_PROFILES.filter((profile) => profile.staffType === "TEACHER").length).toBeGreaterThanOrEqual(3);
    expect(DEMO_STAFF_ATTENDANCE_TODAY.map((record) => record.status)).toEqual(expect.arrayContaining([
      "PRESENT",
      "LATE",
      "HALF_DAY",
      "ABSENT",
      "ON_LEAVE"
    ]));
    expect(DEMO_STAFF_ATTENDANCE_TODAY.some((record) => "correctionReason" in record)).toBe(true);
  });

  it("keeps seed implementation idempotent and avoids QR secrets", () => {
    const seedSource = readFileSync(join(process.cwd(), "prisma/seeds/demo-tenant.seed.ts"), "utf8");
    const dataSource = readFileSync(join(process.cwd(), "prisma/seeds/demo-data.seed.ts"), "utf8");
    expect(seedSource.match(/\.upsert\(/g)?.length ?? 0).toBeGreaterThan(20);
    expect(seedSource).toContain("desiredRoleIds");
    expect(seedSource).toContain("isActive: false");
    expect(seedSource).not.toMatch(/rawToken|qrPayload|StaffAttendanceQrToken\.create/i);
    expect(dataSource).not.toMatch(/gmail\.com|\.local/i);
  });
});
