import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { whatsAppTemplateMessageSchema } from "@/modules/notifications/schemas";

export type WhatsAppProviderCode = "META_CLOUD" | "BSP" | "DRY_RUN";

export type SendWhatsAppTemplateMessageInput = {
  tenantId: string;
  branchId?: string | null;
  to: string;
  templateName: string;
  languageCode: string;
  variables: Record<string, string | number>;
};

export type SendWhatsAppTemplateMessageResult =
  | {
      ok: true;
      provider: WhatsAppProviderCode;
      providerMessageId: string;
    }
  | {
      ok: false;
      provider: WhatsAppProviderCode;
      providerMessageId?: string | null;
      errorCode: string;
      errorMessage: string;
    };

type WhatsAppProviderDeps = {
  getIntegrationSetting(input: { tenantId: string; branchId?: string | null }): Promise<{
    provider: WhatsAppProviderCode;
    isEnabled: boolean;
    phoneNumberId: string | null;
    businessAccountId: string | null;
    accessTokenEncrypted: string | null;
  } | null>;
};

const defaultDeps: WhatsAppProviderDeps = {
  async getIntegrationSetting(input) {
    const branchSetting = input.branchId
      ? await db.whatsAppIntegrationSetting.findFirst({
        where: { tenantId: input.tenantId, branchId: input.branchId, isEnabled: true },
        select: {
          provider: true,
          isEnabled: true,
          phoneNumberId: true,
          businessAccountId: true,
          accessTokenEncrypted: true
        }
      })
      : null;
    if (branchSetting) return branchSetting;

    return db.whatsAppIntegrationSetting.findFirst({
      where: { tenantId: input.tenantId, branchId: null, isEnabled: true },
      select: {
        provider: true,
        isEnabled: true,
        phoneNumberId: true,
        businessAccountId: true,
        accessTokenEncrypted: true
      }
    });
  }
};

export function sanitizeProviderError(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/access_token[=:]\s*[^&\s]+/gi, "access_token=[redacted]")
    .replace(/token[=:]\s*[^&\s]+/gi, "token=[redacted]")
    .slice(0, 500);
}

export async function sendWhatsAppTemplateMessage(
  input: SendWhatsAppTemplateMessageInput,
  deps: WhatsAppProviderDeps = defaultDeps
): Promise<SendWhatsAppTemplateMessageResult> {
  const data = whatsAppTemplateMessageSchema.parse(input);
  if ((process.env.WHATSAPP_PROVIDER_MODE ?? "DRY_RUN") === "DRY_RUN") {
    return {
      ok: true,
      provider: "DRY_RUN",
      providerMessageId: `dry-run-${randomUUID()}`
    };
  }

  const setting = await deps.getIntegrationSetting({
    tenantId: data.tenantId,
    branchId: data.branchId
  });
  if (!setting?.isEnabled) {
    return {
      ok: false,
      provider: "META_CLOUD",
      errorCode: "WHATSAPP_PROVIDER_NOT_CONFIGURED",
      errorMessage: "WhatsApp provider is not configured for this tenant or branch."
    };
  }

  if (!setting.phoneNumberId || !setting.businessAccountId || !setting.accessTokenEncrypted) {
    return {
      ok: false,
      provider: setting.provider,
      errorCode: "WHATSAPP_PROVIDER_SECRET_STORAGE_REQUIRED",
      errorMessage: "WhatsApp provider credentials require approved encrypted secret storage before live sending."
    };
  }

  return {
    ok: false,
    provider: setting.provider,
    errorCode: "WHATSAPP_LIVE_SEND_DEFERRED",
    errorMessage: "Live WhatsApp sending is deferred until provider secret decryption is configured."
  };
}
