export const STAFFBOARD_LITE_PERMISSIONS = [
  "staffboard.staff.view",
  "staffboard.staff.create",
  "staffboard.staff.update",
  "staffboard.staff.deactivate",
  "staffboard.attendance.qr.generate",
  "staffboard.attendance.self_scan",
  "staffboard.attendance.view",
  "staffboard.attendance.correct",
  "staffboard.attendance.report"
] as const;

export type StaffboardLitePermissionCode = (typeof STAFFBOARD_LITE_PERMISSIONS)[number];
