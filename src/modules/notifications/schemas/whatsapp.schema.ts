import { z } from "zod";

const uuid = z.string().uuid();
const phone = z.string().trim().min(8).max(20);

export const whatsAppTemplateMessageSchema = z.object({
  tenantId: uuid,
  branchId: uuid.optional().nullable(),
  to: phone,
  templateName: z.string().trim().min(2).max(160),
  languageCode: z.string().trim().min(2).max(12).default("en"),
  variables: z.record(z.union([z.string(), z.number()]))
}).strict();

export const whatsAppWebhookStatusSchema = z.object({
  providerMessageId: z.string().trim().min(1).max(240),
  status: z.enum(["SENT", "DELIVERED", "READ", "FAILED"]),
  rawStatusJson: z.unknown().optional(),
  errorCode: z.string().trim().max(120).optional(),
  errorMessage: z.string().trim().max(500).optional()
}).strict();

export const whatsAppWebhookClientPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.unknown()).optional()
}).passthrough();
