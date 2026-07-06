import { processNotificationOutbox } from "@/modules/notifications/services/notification-outbox.service";

export async function processNotificationOutboxJob(input: unknown) {
  return processNotificationOutbox(input);
}
