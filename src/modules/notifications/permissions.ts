export const NOTIFICATION_PERMISSIONS = [
  "notifications.settings.manage",
  "notifications.outbox.view",
  "notifications.outbox.process",
  "notifications.whatsapp.manage"
] as const;

export type NotificationPermissionCode = (typeof NOTIFICATION_PERMISSIONS)[number];
