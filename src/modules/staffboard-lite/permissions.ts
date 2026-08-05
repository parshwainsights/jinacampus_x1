export const STAFFBOARD_LITE_PERMISSIONS = [
  "staffboard.staff.view",
  "staffboard.staff.create",
  "staffboard.staff.update",
  "staffboard.staff.deactivate",
  "staffboard.attendance.qr.generate",
  "staffboard.attendance.self_scan",
  "staffboard.attendance.self_view",
  "staffboard.attendance.view",
  "staffboard.attendance.correct",
  "staffboard.attendance.report",
  "staffboard.leave.self_apply",
  "staffboard.leave.self_view",
  "staffboard.leave.view",
  "staffboard.leave.approve",
  "staffboard.leave.settings.manage",
  "staffboard.leave.balance.manage"
] as const;

export type StaffboardLitePermissionCode = (typeof STAFFBOARD_LITE_PERMISSIONS)[number];
