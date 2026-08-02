import { z } from "zod";

const webAuthnResponseSchema = z.object({
  id: z.string().min(1).max(2048),
  rawId: z.string().min(1).max(2048),
  response: z.record(z.unknown()),
  clientExtensionResults: z.record(z.unknown()),
  type: z.literal("public-key")
}).passthrough();

export const passkeyAuthenticationOptionsSchema = z.object({
  schoolId: z.unknown().optional(),
  tenantSlug: z.unknown().optional(),
  identifier: z.string().trim().min(1).max(180)
}).strict();

export const passkeyAuthenticationVerifySchema = z.object({
  schoolId: z.unknown().optional(),
  tenantSlug: z.unknown().optional(),
  challenge: z.string().min(20).max(512),
  response: webAuthnResponseSchema
}).strict();

export const passkeyRegistrationOptionsSchema = z.object({
  currentPassword: z.string().min(1).max(200)
}).strict();

export const passkeyRegistrationVerifySchema = z.object({
  challenge: z.string().min(20).max(512),
  response: webAuthnResponseSchema,
  name: z.string().trim().min(1).max(80).optional()
}).strict();

export const passkeyDeleteSchema = z.object({
  credentialId: z.string().uuid(),
  currentPassword: z.string().min(1).max(200)
}).strict();
