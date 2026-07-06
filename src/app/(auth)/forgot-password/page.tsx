"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordRecoveryAction, type CampusCoreFormActionState } from "@/modules/campus-core/actions";
import { PASSWORD_RECOVERY_HELP_TEXT } from "@/modules/campus-core/password-recovery-policy";
import { FormField, FormMessage, getFieldError } from "@/components/ui/form-primitives";

const initialState: CampusCoreFormActionState = { ok: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordRecoveryAction, initialState);

  return (
    <main className="flex min-h-screen w-full max-w-full items-center justify-start overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_30rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-4 py-8 sm:justify-center">
      <form action={formAction} className="premium-glass-panel box-border min-w-0 w-[calc(100vw-2rem)] max-w-72 overflow-hidden p-5 sm:w-full sm:max-w-md sm:p-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-base font-semibold text-white shadow-sm shadow-brand-900/20">
            JC
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Forgot password?</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{PASSWORD_RECOVERY_HELP_TEXT}</p>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <FormMessage state={state} />
          <FormField id="recovery-email" label="Email" required error={getFieldError(state.fieldErrors, "email")}>
            <input id="recovery-email" className="min-h-11 w-full" name="email" type="email" autoComplete="username" disabled={pending} required />
          </FormField>
          <button disabled={pending} className="premium-primary-button w-full premium-focus">
            {pending ? "Submitting..." : "Submit request"}
          </button>
          <Link href="/login" className="premium-secondary-button w-full premium-focus">
            Back to login
          </Link>
        </div>
      </form>
    </main>
  );
}
