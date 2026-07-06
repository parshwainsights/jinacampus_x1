import type { MobileUser } from "../api/contracts";

export type MobileHomeAction = {
  label: string;
  description: string;
  href?: "/(app)/scan-qr" | "/(app)/teacher-attendance" | "/(app)/attendance-status";
  disabled?: boolean;
};

function hasRole(user: MobileUser | null, roles: string[]) {
  const roleSet = new Set(user?.roles.map((role) => role.code) ?? []);
  return roles.some((role) => roleSet.has(role));
}

export function getRoleAwareActions(user: MobileUser | null): MobileHomeAction[] {
  if (!user) return [];

  const actions: MobileHomeAction[] = [];
  const isAdmin = hasRole(user, ["ADMIN", "PRINCIPAL", "TENANT_OWNER"]);

  if (user.capabilities.canMarkStudentAttendance) {
    actions.push({
      label: "Mark Student Attendance",
      description: "Mark daily attendance for assigned class-sections.",
      href: "/(app)/teacher-attendance"
    });
  }

  if (user.capabilities.canScanStaffQr) {
    actions.push({
      label: "Scan QR",
      description: "Scan staff check-in/check-out QR codes.",
      href: "/(app)/scan-qr"
    });
  }

  if (user.capabilities.canViewMyAttendance) {
    actions.push({
      label: "My Attendance",
      description: "View today's staff attendance status.",
      href: "/(app)/attendance-status"
    });
  }

  if (isAdmin) {
    actions.push({
      label: "Dashboard Summary",
      description: "Native admin dashboard is out of v0.1 scope. Use the web admin console for full administration.",
      disabled: true
    });
  }

  return actions;
}
