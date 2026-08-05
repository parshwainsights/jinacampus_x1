"use client";

import { useActionState } from "react";
import {
  updateCommunicationPreferenceAction,
  type CommunicationPreferenceActionState
} from "@/modules/notifications/actions/communication-preference.actions";

type Preference = {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  attendanceAlertsEnabled: boolean;
  weeklySummaryEnabled: boolean;
  monthlySummaryEnabled: boolean;
  leaveUpdatesEnabled: boolean;
  consentCapturedAt: Date | string | null;
};

const initialState: CommunicationPreferenceActionState = { ok: false };

export function CommunicationPreferenceForm({
  ownerType,
  ownerId,
  hasRegisteredPhone,
  preference
}: {
  ownerType: "GUARDIAN" | "STAFF";
  ownerId: string;
  hasRegisteredPhone: boolean;
  preference: Preference | null;
}) {
  const [state, action, pending] = useActionState(updateCommunicationPreferenceAction, initialState);
  const consentError = state.fieldErrors?.consentConfirmed?.[0];

  return (
    <section className="premium-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">WhatsApp attendance communication</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Delivery remains disabled until consent is recorded. The registered mobile is used unless an approved WhatsApp number is entered below.
        </p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="ownerType" value={ownerType} />
        <input type="hidden" name="ownerId" value={ownerId} />
        {state.message ? (
          <p role={state.ok ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
            {state.message}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            WhatsApp number override
            <input
              name="whatsappNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={preference?.whatsappNumber ?? ""}
              placeholder={hasRegisteredPhone ? "Use registered mobile" : "Country code and mobile number"}
              className="mt-1 min-h-11 w-full"
            />
          </label>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" name="whatsappEnabled" defaultChecked={preference?.whatsappEnabled ?? false} />
              Enable WhatsApp delivery
            </label>
            {ownerType === "GUARDIAN" ? (
              <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="attendanceAlertsEnabled" defaultChecked={preference?.attendanceAlertsEnabled ?? false} />
                Student daily attendance notifications
              </label>
            ) : (
              <>
                <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="weeklySummaryEnabled" defaultChecked={preference?.weeklySummaryEnabled ?? false} />
                  Weekly attendance report
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="monthlySummaryEnabled" defaultChecked={preference?.monthlySummaryEnabled ?? false} />
                  Monthly attendance report
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="leaveUpdatesEnabled" defaultChecked={preference?.leaveUpdatesEnabled ?? false} />
                  Leave application updates
                </label>
              </>
            )}
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <input type="checkbox" name="consentConfirmed" defaultChecked={Boolean(preference?.consentCapturedAt)} className="mt-1" />
          <span>I confirm that the recipient has consented to receive attendance communication on WhatsApp.</span>
        </label>
        {consentError ? <p className="text-sm font-medium text-rose-700">{consentError}</p> : null}
        <button type="submit" disabled={pending} className="premium-primary-button min-h-11 w-full sm:w-auto">
          {pending ? "Saving..." : "Save WhatsApp Preferences"}
        </button>
      </form>
    </section>
  );
}
