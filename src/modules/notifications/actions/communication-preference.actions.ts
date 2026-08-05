"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { updateCommunicationPreferenceSchema } from "@/modules/notifications/schemas";
import { updateCommunicationPreference } from "@/modules/notifications/services/communication-preference.service";

export type CommunicationPreferenceActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function definedFieldErrors(error: z.ZodError): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1])
    )
  );
}

export async function updateCommunicationPreferenceAction(
  _state: CommunicationPreferenceActionState,
  formData: FormData
): Promise<CommunicationPreferenceActionState> {
  try {
    const input = updateCommunicationPreferenceSchema.parse({
      ownerType: formData.get("ownerType"),
      ownerId: formData.get("ownerId"),
      whatsappEnabled: checked(formData, "whatsappEnabled"),
      whatsappNumber: formData.get("whatsappNumber"),
      attendanceAlertsEnabled: checked(formData, "attendanceAlertsEnabled"),
      weeklySummaryEnabled: checked(formData, "weeklySummaryEnabled"),
      monthlySummaryEnabled: checked(formData, "monthlySummaryEnabled"),
      leaveUpdatesEnabled: checked(formData, "leaveUpdatesEnabled"),
      consentConfirmed: checked(formData, "consentConfirmed")
    });
    const ctx = await getTenantContext();
    await updateCommunicationPreference(ctx, input);
    revalidatePath(input.ownerType === "GUARDIAN"
      ? `/academia/guardians/${input.ownerId}/edit`
      : `/staffboard/staff/${input.ownerId}/edit`);
    return { ok: true, message: "WhatsApp communication preferences saved." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: "Review the highlighted WhatsApp preference fields.",
        fieldErrors: definedFieldErrors(error)
      };
    }
    const mapped = mapActionError(error, { fallbackMessage: "Unable to save WhatsApp preferences." });
    return { ok: false, message: mapped.error, fieldErrors: mapped.fieldErrors };
  }
}
