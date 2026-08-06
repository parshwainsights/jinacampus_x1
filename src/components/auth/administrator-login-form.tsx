"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";
import { ADMINISTRATOR_LOGIN_ERROR_MESSAGE } from "@/modules/campus-core/tenant-login-policy";

const PASSWORD_FORMAT_ERROR_MESSAGE = "Remove spaces or invisible characters before or after the password, then try again.";

function hasPasswordFormattingIssue(value: string) {
  return value !== value.trim() || /[\u200B-\u200D\uFEFF\r\n]/u.test(value);
}

function LoadingSpinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3a9 9 0 1 1-8.2 5.3" opacity="0.28" />
      <path d="M12 3a9 9 0 0 1 8.2 5.3" />
    </svg>
  );
}

export function AdministratorLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "");
    const submittedPassword = String(formData.get("password") ?? "");
    const normalizedEmail = submittedEmail.trim().toLowerCase();
    if (hasPasswordFormattingIssue(submittedPassword)) {
      setError(PASSWORD_FORMAT_ERROR_MESSAGE);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/administrator-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: submittedPassword
        })
      });

      if (!response.ok) {
        setError(ADMINISTRATOR_LOGIN_ERROR_MESSAGE);
        return;
      }

      const result = await response.json().catch(() => ({}));
      const redirectTo =
        typeof result.redirectTo === "string" && result.redirectTo.startsWith("/") && !result.redirectTo.startsWith("//")
          ? result.redirectTo
          : "/administrator";
      window.location.href = redirectTo;
    } catch {
      setError(ADMINISTRATOR_LOGIN_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      className="auth-form-panel min-w-0 p-5 sm:p-8 lg:p-9"
      aria-busy={isSubmitting}
      data-auth-pending={isSubmitting ? "true" : "false"}
    >
      <BrandLogo className="mx-auto mb-7 hidden w-[17rem] lg:block" priority />
      <div className="space-y-2">
        <span className="inline-flex min-h-8 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800">
          Platform Portal
        </span>
        <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">JinaCampus Administrator</h1>
        <p className="text-sm leading-6 text-slate-500">Authorized platform operators only. School users should use School Login.</p>
      </div>

      <div className="mt-8 space-y-4">
        <FormField id="administrator-email" label="Email" required>
          <input
            id="administrator-email"
            className="auth-field-input w-full outline-none transition"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value.toLowerCase())}
            disabled={isSubmitting}
            required
          />
        </FormField>
        <FormField id="administrator-password" label="Password" required>
          <PasswordInput
            id="administrator-password"
            className="auth-field-input w-full outline-none transition"
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </FormField>
        <p className="text-xs leading-5 text-slate-500">Password is case-sensitive. If you pasted it, remove any spaces before or after the password.</p>
        {error ? <p role="alert" className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">{error}</p> : null}
        <button type="submit" disabled={isSubmitting} className="auth-action-button auth-action-primary premium-focus" aria-live="polite">
          {isSubmitting ? <><LoadingSpinner /> Signing in...</> : "Sign in to Administrator Portal"}
        </button>
        <div className="flex justify-center">
          <Link href="/" className="inline-flex min-h-12 items-center text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
            Back to School Login
          </Link>
        </div>
      </div>
    </form>
  );
}
