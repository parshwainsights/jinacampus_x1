import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { PermissionCode } from "@/lib/rbac/permissions";
import { DASHBOARD_QUICK_ACTIONS, getVisibleDashboardQuickActions } from "@/modules/dashboard/components/dashboard-state";

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("dashboard UI", () => {
  it("wires the dashboard route to server-side dashboard query services", () => {
    const routeSource = readProjectFile("src/app/(dashboard)/dashboard/page.tsx");

    expect(routeSource).toContain("requireAuth");
    expect(routeSource).toContain("getCampusCoreDashboardMetrics");
    expect(routeSource).toContain("getAcademiaDashboardMetrics");
    expect(routeSource).toContain("getStudentAttendanceDashboardMetrics");
    expect(routeSource).toContain("getStaffBoardDashboardMetrics");
    expect(routeSource).toContain("getStaffAttendanceDashboardMetrics");
    expect(routeSource).not.toContain("@/lib/db");
  });

  it("renders the dashboard header and expected metric labels", () => {
    const combinedSource = [
      "src/app/(dashboard)/dashboard/page.tsx",
      "src/modules/dashboard/components/dashboard-page-header.tsx",
      "src/modules/dashboard/components/dashboard-metric-group.tsx",
      "src/modules/dashboard/components/dashboard-metric-card.tsx"
    ].map(readProjectFile).join("\n");

    for (const label of [
      "JinaCampus Dashboard",
      "School operations control center",
      "Today's Attendance",
      "School Setup",
      "Academics",
      "StaffBoard Lite",
      "Quick Actions",
      "Branches",
      "Active Academic Year",
      "Users",
      "Roles",
      "Active Students",
      "Active Enrollments",
      "Students Marked Today",
      "Classes Not Marked",
      "Active Staff",
      "Staff Checked In",
      "Half Day",
      "Not Marked"
    ]) {
      expect(combinedSource).toContain(label);
    }
  });

  it("renders dashboard attention and empty attendance states", () => {
    const routeSource = readProjectFile("src/app/(dashboard)/dashboard/page.tsx");
    const attentionSource = readProjectFile("src/modules/dashboard/components/dashboard-attention-panel.tsx");

    expect(routeSource).toContain("DashboardAttentionPanel");
    expect(routeSource).toContain("Absent students");
    expect(routeSource).toContain("Classes not marked");
    expect(routeSource).toContain("Late staff");
    expect(routeSource).toContain("Staff not marked");
    expect(routeSource).toContain("Attendance has not been marked yet today.");
    expect(routeSource).toContain("No staff check-ins recorded yet today.");
    expect(attentionSource).toContain('aria-label="Dashboard attention items"');
    expect(attentionSource).toContain('data-dashboard-attention-item="true"');
  });

  it("keeps quick actions limited to existing MVP routes and role permissions", () => {
    expect(DASHBOARD_QUICK_ACTIONS.map((action) => action.href)).toEqual([
      "/academia/students",
      "/academia/attendance/mark",
      "/academia/attendance/reports",
      "/staffboard/attendance/qr",
      "/staffboard/attendance",
      "/staffboard/attendance/reports",
      "/staffboard/staff",
      "/staffboard/attendance/scan"
    ]);
    expect(DASHBOARD_QUICK_ACTIONS.map((action) => action.label)).toContain("Generate Staff QR");
    expect(DASHBOARD_QUICK_ACTIONS.map((action) => action.label)).toContain("Staff Attendance");

    const permissions = new Set<PermissionCode>([
      "campuscore.tenant.view",
      "academia.attendance.view",
      "academia.attendance.mark",
      "staffboard.staff.view"
    ]);
    expect(getVisibleDashboardQuickActions(permissions).map((action) => action.href)).toEqual([
      "/academia/attendance/mark",
      "/staffboard/staff"
    ]);
  });

  it("renders the empty state used when dashboard data is unavailable", () => {
    const routeSource = readProjectFile("src/app/(dashboard)/dashboard/page.tsx");
    const emptyStateSource = readProjectFile("src/modules/dashboard/components/dashboard-empty-state.tsx");

    expect(routeSource).toContain("Dashboard data unavailable");
    expect(routeSource).toContain("No active academic year");
    expect(routeSource).toContain("No branch context");
    expect(emptyStateSource).toContain("DashboardEmptyState");
  });

  it("does not expose QR token secrets or out-of-scope modules in dashboard UI", () => {
    const combinedSource = [
      "src/app/(dashboard)/dashboard/page.tsx",
      "src/modules/dashboard/components/dashboard-state.ts",
      "src/modules/dashboard/components/dashboard-quick-actions.tsx"
    ].map(readProjectFile).join("\n");

    expect(combinedSource).not.toMatch(/tokenHash|rawToken/i);
    expect(combinedSource).not.toMatch(/FeeDesk|GradeBook|SchoolCast|payroll|biometric/i);
  });
});
