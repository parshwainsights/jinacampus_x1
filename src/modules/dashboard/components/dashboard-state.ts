import type { PermissionCode } from "@/lib/rbac/permissions";
import { getNavigationAudience, type NavigationAudience } from "@/components/app-shell/navigation";
import { DASHBOARD_VIEW_PERMISSION } from "@/modules/dashboard/permissions";

export type DashboardSectionKey = "campusCore" | "academia" | "studentAttendance" | "staffBoard" | "staffAttendance";

type DashboardQuickActionDefinition = {
  label: string;
  description: string;
  href: string;
  permissions: readonly PermissionCode[];
  audiences: readonly NavigationAudience[];
};

const sectionPermissions = {
  campusCore: [DASHBOARD_VIEW_PERMISSION],
  academia: ["academia.student.view", "academia.enrollment.manage", "academia.class.manage", "academia.guardian.manage"],
  studentAttendance: ["academia.attendance.view", "academia.attendance.report", "academia.attendance.mark"],
  staffBoard: ["staffboard.staff.view"],
  staffAttendance: ["staffboard.attendance.view", "staffboard.attendance.report", "staffboard.attendance.qr.generate", "staffboard.attendance.self_scan"]
} satisfies Record<DashboardSectionKey, readonly PermissionCode[]>;

export const DASHBOARD_QUICK_ACTIONS = [
  {
    label: "Manage Students",
    description: "Open student profile records.",
    href: "/academia/students",
    permissions: ["academia.student.view"],
    audiences: ["admin"]
  },
  {
    label: "Mark Student Attendance",
    description: "Open the daily class-section marking workflow.",
    href: "/academia/attendance/mark",
    permissions: ["academia.attendance.view", "academia.attendance.mark"],
    audiences: ["admin", "teacher"]
  },
  {
    label: "Student Reports",
    description: "Review daily, absent, late, and monthly attendance tables.",
    href: "/academia/attendance/reports",
    permissions: ["academia.attendance.report"],
    audiences: ["admin", "teacher"]
  },
  {
    label: "Generate Staff QR",
    description: "Generate a time-bound QR code for staff check-in or check-out.",
    href: "/staffboard/attendance/qr",
    permissions: ["staffboard.attendance.qr.generate"],
    audiences: ["admin"]
  },
  {
    label: "Staff Attendance",
    description: "Review daily staff attendance and correction entry points.",
    href: "/staffboard/attendance",
    permissions: ["staffboard.attendance.view"],
    audiences: ["admin"]
  },
  {
    label: "Staff Reports",
    description: "Review staff attendance, late arrivals, and corrections.",
    href: "/staffboard/attendance/reports",
    permissions: ["staffboard.attendance.report"],
    audiences: ["admin"]
  },
  {
    label: "Manage Staff",
    description: "Open StaffBoard Lite staff profiles.",
    href: "/staffboard/staff",
    permissions: ["staffboard.staff.view"],
    audiences: ["admin"]
  },
  {
    label: "Scan QR",
    description: "Open the staff-facing QR scan page.",
    href: "/staffboard/attendance/scan",
    permissions: ["staffboard.attendance.self_scan"],
    audiences: ["teacher", "staff"]
  }
] as const satisfies readonly DashboardQuickActionDefinition[];

export type DashboardQuickAction = (typeof DASHBOARD_QUICK_ACTIONS)[number];

export function canViewDashboard(permissions: ReadonlySet<PermissionCode>) {
  return permissions.has(DASHBOARD_VIEW_PERMISSION);
}

export function canViewDashboardSection(
  permissions: ReadonlySet<PermissionCode>,
  section: DashboardSectionKey
) {
  return sectionPermissions[section].some((permission) => permissions.has(permission));
}

export function getVisibleDashboardQuickActions(permissions: ReadonlySet<PermissionCode>) {
  const audience = getNavigationAudience(permissions);
  return DASHBOARD_QUICK_ACTIONS.filter((action) =>
    action.audiences.some((actionAudience) => actionAudience === audience) &&
    action.permissions.every((permission) => permissions.has(permission))
  );
}

export function formatDashboardDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(date));
}
