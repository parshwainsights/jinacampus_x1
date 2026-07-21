"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";

type ForgotPasswordFormProps = {
  initialSchoolId: string;
};

type RecoveryStep = "request" | "reset" | "success";

function normalizeSchoolCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeIdentifier(value: string) {
  return value.includes("@") ? value.trim().toLowerCase() : value.trim();
}

function identityPayload(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  return normalized.includes("@") ? { email: normalized } : { phone: normalized };
}

function LoadingSpinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a9 9 0 1 1-8.2 5.3" opacity="0.28" />
      <path d="M12 3a9 9 0 0 1 8.2 5.3" />
    </svg>
  );
}

export function ForgotPasswordForm({ initialSchoolId }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<RecoveryStep>("request");
  const [schoolId, setSchoolId] = useState(initialSchoolId);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const loginHref = schoolId ? `/login?schoolId=${encodeURIComponent(normalizeSchoolCode(schoolId))}` : "/login";

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setNotice(null);

    const normalizedSchoolId = normalizeSchoolCode(schoolId);
    const normalizedIdentifier = normalizeIdentifier(identifier);
    setSchoolId(normalizedSchoolId);
    setIdentifier(normalizedIdentifier);

    try {
      const response = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantSlug: normalizedSchoolId, ...identityPayload(normalizedIdentifier) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError("Unable to process the password reset request. Check the entered details and try again.");
        setPending(false);
        return;
      }
      setNotice(typeof result.message === "string" ? result.message : "If the account is registered, an OTP has been sent.");
      setStep("reset");
      setPending(false);
    } catch {
      setError("Unable to process the password reset request. Please try again.");
      setPending(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug: normalizeSchoolCode(schoolId),
          ...identityPayload(identifier),
          otp,
          newPassword
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Unable to reset password. Check the OTP and try again.");
        setPending(false);
        return;
      }
      setStep("success");
      setNotice("Password reset successfully. Sign in with your new password.");
      setPending(false);
    } catch {
      setError("Unable to reset password. Please try again.");
      setPending(false);
    }
  }

  return (
    <section className="premium-glass-panel box-border w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[1.75rem] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:w-full sm:p-8">
      <div className="text-center">
        <img src="/brand/jinacampus-mark-transparent.png" alt="JinaCampus logo" className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">Forgot password?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Verify the contact number linked to your school account, then choose a new password.
        </p>
      </div>

      {step === "request" ? (
        <form onSubmit={requestOtp} className="mt-7 space-y-4">
          <FormField id="recovery-school-id" label="School ID" required>
            <input
              id="recovery-school-id"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              autoComplete="organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              required
            />
          </FormField>
          <FormField id="recovery-identifier" label="Email or contact number" required>
            <input
              id="recovery-identifier"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              required
            />
          </FormField>
          <button type="submit" disabled={pending} className="premium-primary-button min-h-12 w-full gap-2 premium-focus disabled:opacity-60">
            {pending ? <><LoadingSpinner />Sending OTP...</> : "Send OTP"}
          </button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={resetPassword} className="mt-7 space-y-4">
          <FormField id="recovery-otp" label="6-digit OTP" required>
            <input
              id="recovery-otp"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-slate-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              disabled={pending}
              required
            />
          </FormField>
          <FormField id="recovery-new-password" label="New password" required>
            <PasswordInput
              id="recovery-new-password"
              name="newPassword"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              required
            />
          </FormField>
          <FormField id="recovery-confirm-password" label="Confirm new password" required>
            <PasswordInput
              id="recovery-confirm-password"
              name="confirmPassword"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              required
            />
          </FormField>
          <p className="text-xs leading-5 text-slate-500">
            Use at least 10 characters with uppercase, lowercase, number, and symbol.
          </p>
          <button type="submit" disabled={pending} className="premium-primary-button min-h-12 w-full gap-2 premium-focus disabled:opacity-60">
            {pending ? <><LoadingSpinner />Resetting...</> : "Reset password"}
          </button>
          <button type="button" disabled={pending} onClick={() => { setStep("request"); setOtp(""); setError(null); }} className="premium-secondary-button min-h-11 w-full premium-focus">
            Use different details
          </button>
        </form>
      ) : null}

      {notice ? <p role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">{notice}</p> : null}
      {error ? <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">{error}</p> : null}

      <Link href={loginHref} className="premium-secondary-button mt-5 min-h-11 w-full premium-focus">
        {step === "success" ? "Back to login" : "Cancel and return to login"}
      </Link>
    </section>
  );
}
