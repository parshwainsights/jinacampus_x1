export const STAFFBOARD_LITE_AUDIT_EVENTS = {
  STAFF_CREATED: "staffboard.staff.created",
  STAFF_UPDATED: "staffboard.staff.updated",
  STAFF_DEACTIVATED: "staffboard.staff.deactivated",
  STAFF_EMPLOYMENT_STATUS_CHANGED: "staffboard.staff.employment_status_changed",
  STAFF_LOGIN_ACCESS_CREATED: "staffboard.staff.login_access_created",
  STAFF_LOGIN_ACCESS_DISABLED: "staffboard.staff.login_access_disabled",
  STAFF_ATTENDANCE_QR_GENERATED: "staffboard.attendance.qr.generated",
  STAFF_ATTENDANCE_CHECK_IN: "staffboard.attendance.check_in",
  STAFF_ATTENDANCE_CHECK_OUT: "staffboard.attendance.check_out",
  STAFF_ATTENDANCE_CORRECTED: "staffboard.attendance.corrected"
} as const;
