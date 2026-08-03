"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { PasswordInput } from "@/components/forms/password-input";
import { FormField, FormMessage, getFieldError } from "@/components/ui/form-primitives";
import { changePlatformAdministratorPasswordAction } from "@/modules/campus-core/administrator-actions";
import type { CampusCoreFormActionState } from "@/modules/campus-core/actions";

const initialState: CampusCoreFormActionState = { ok: false };
const inputClassName = "min-h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm premium-focus";

export function PlatformAdministratorPasswordForm({
  email,
  passwordChangeRequired
}: {
  email: string;
  passwordChangeRequired: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    changePlatformAdministratorPasswordAction,
    initialState
  );

  useEffect(() => {
    if (!state.ok) return;
    router.replace("/administrator");
    router.refresh();
  }, [router, state.ok]);

  return (
    <form action={formAction} className="premium-card space-y-5 p-5 sm:p-6">
      <div>
        <p className="premium-muted-chip">Platform Administrator</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Change administrator password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Signed in as {email}. The current password is required and passwords remain case-sensitive.
        </p>
      </div>
      {passwordChangeRequired ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Replace the temporary password before managing schools.
        </p>
      ) : null}
      <FormMessage state={state} />
      <FormField id="platform-current-password" label="Current Password" required error={getFieldError(state.fieldErrors, "currentPassword")}>
        <PasswordInput id="platform-current-password" name="currentPassword" autoComplete="current-password" required className={inputClassName} />
      </FormField>
      <FormField id="platform-new-password" label="New Password" required helpText="Use at least 8 characters." error={getFieldError(state.fieldErrors, "newPassword")}>
        <PasswordInput id="platform-new-password" name="newPassword" autoComplete="new-password" required className={inputClassName} />
      </FormField>
      <FormField id="platform-confirm-password" label="Confirm New Password" required error={getFieldError(state.fieldErrors, "confirmNewPassword")}>
        <PasswordInput id="platform-confirm-password" name="confirmNewPassword" autoComplete="new-password" required className={inputClassName} />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {!passwordChangeRequired ? (
          <Link href="/administrator/profile" className="premium-secondary-button w-full premium-focus sm:w-auto">
            Cancel
          </Link>
        ) : null}
        <button type="submit" disabled={pending} className="premium-primary-button w-full premium-focus sm:w-auto">
          {pending ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
