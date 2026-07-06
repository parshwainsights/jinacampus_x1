import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("auth access browser QA route permission states", () => {
  it("renders safe permission states for CampusCore roles instead of throwing through the route error boundary", () => {
    const route = source("src/app/(dashboard)/campus-core/roles/page.tsx");

    expect(route).toContain("PermissionState");
    expect(route).toContain("getEffectivePermissions");
    expect(route).toContain('effectivePermissions.has("campuscore.role.view")');
    expect(route).not.toContain('await requirePermission({ ctx, permission: "campuscore.role.view"');
  });

  it("renders safe permission states for audit logs instead of leaking forbidden stack traces in browser QA", () => {
    const route = source("src/app/(dashboard)/campus-core/audit-logs/page.tsx");

    expect(route).toContain("PermissionState");
    expect(route).toContain("getEffectivePermissions");
    expect(route).toContain('permissions.has("campuscore.audit.view")');
    expect(route).not.toContain('await requirePermission({ ctx, permission: "campuscore.audit.view"');
  });

  it("renders safe permission states for CampusCore settings instead of throwing through the route error boundary", () => {
    const route = source("src/app/(dashboard)/campus-core/settings/page.tsx");

    expect(route).toContain("PermissionState");
    expect(route).toContain("getEffectivePermissions");
    expect(route).toContain('permissions.has("campuscore.settings.manage")');
    expect(route).not.toContain('await requirePermission({ ctx, permission: "campuscore.settings.manage"');
  });

  it("keeps the student list view permission-gated and hides create controls without create permission", () => {
    const route = source("src/app/(dashboard)/academia/students/page.tsx");

    expect(route).toContain("PermissionState");
    expect(route).toContain("getEffectivePermissions");
    expect(route).toContain('permissions.has("academia.student.view")');
    expect(route).toContain('permissions.has("academia.student.create")');
    expect(route).toContain('permissions.has("academia.student.update")');
    expect(route).toContain('href="/academia/students/create"');
    expect(route).toContain("canCreateStudents ? (");
    expect(route).toContain("canUpdateStudents ? (");
  });

  it("keeps StaffBoard profile create and edit controls permission-aware for office staff", () => {
    const route = source("src/app/(dashboard)/staffboard/staff/page.tsx");

    expect(route).toContain("PermissionState");
    expect(route).toContain("getEffectivePermissions");
    expect(route).toContain('permissions.has("staffboard.staff.view")');
    expect(route).toContain('permissions.has("staffboard.staff.create")');
    expect(route).toContain('permissions.has("staffboard.staff.update")');
    expect(route).toContain("canCreateStaff ? <StaffProfileCreateForm");
    expect(route).toContain("canUpdateStaff ? staffProfileListConfig.columns");
    expect(route).toContain("canUpdateStaff ? (");
  });
});
