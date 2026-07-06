"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";

type LoginFormProps = {
  schoolId: string | null;
  schoolIdLocked: boolean;
  schoolName: string | null;
  logoUrl: string | null;
};

const LOGIN_ERROR_MESSAGE = "Login failed. Please check your credentials.";

function normalizeSchoolCodeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "");
}

function normalizeSchoolCodeForSubmit(value: string) {
  return normalizeSchoolCodeInput(value.trim()).replace(/-+$/g, "");
}

function normalizeEmailInput(value: string) {
  return value.toLowerCase();
}

function normalizeEmailForSubmit(value: string) {
  return value.trim().toLowerCase();
}

function LoadingSpinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3a9 9 0 1 1-8.2 5.3" opacity="0.28" />
      <path d="M12 3a9 9 0 0 1 8.2 5.3" />
    </svg>
  );
}

export function LoginForm({ schoolId, schoolIdLocked, schoolName, logoUrl }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolIdValue, setSchoolIdValue] = useState(schoolId ?? "");
  const [emailValue, setEmailValue] = useState("");
  const displayName = schoolName ?? "your school";
  const recoveryHref = schoolId ? `/forgot-password?schoolId=${encodeURIComponent(schoolId)}` : "/forgot-password";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const normalizedTenantSlug = normalizeSchoolCodeForSubmit(String(formData.get("schoolId") ?? ""));
    const normalizedEmail = normalizeEmailForSubmit(String(formData.get("email") ?? ""));
    if (!schoolIdLocked) setSchoolIdValue(normalizedTenantSlug);
    setEmailValue(normalizedEmail);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug: normalizedTenantSlug,
          email: normalizedEmail,
          password: formData.get("password")
        })
      });

      if (!response.ok) {
        setError(LOGIN_ERROR_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      const result = await response.json().catch(() => ({}));
      const redirectTo =
        typeof result.redirectTo === "string" && result.redirectTo.startsWith("/") && !result.redirectTo.startsWith("//")
          ? result.redirectTo
          : "/dashboard";
      window.location.href = redirectTo;
    } catch {
      setError(LOGIN_ERROR_MESSAGE);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="premium-glass-panel box-border w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[1.75rem] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:w-full sm:p-8"
      data-mobile-login-form="true"
    >
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/90 shadow-lg shadow-brand-900/10 ring-1 ring-slate-200/60">
          <img
            src="/brand/jinacampus-mark-transparent.png"
            alt="JinaCampus logo"
            className="h-16 w-16 object-contain"
          />
        </div>
        <div className="mt-4 min-w-0">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">JinaCampus</h1>
          <p className="mt-1 text-base font-semibold text-brand-700">The Complete School OS</p>
          <p className="mt-1 max-w-full break-words text-sm leading-5 text-slate-500">powered by Parshav Insights</p>
        </div>
        {logoUrl || schoolName ? (
          <div className="mt-5 flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/78 px-3 py-2 text-left">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${displayName} logo`}
                className="h-9 w-9 shrink-0 rounded-xl border border-slate-100 object-cover"
              />
            ) : null}
            <p className="min-w-0 truncate text-sm font-semibold text-slate-700">{displayName}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-7 space-y-4">
        {schoolIdLocked ? (
          <>
            <input type="hidden" name="schoolId" value={schoolId ?? ""} />
            <p className="rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm font-semibold text-brand-700">
              School ID selected for this login: {schoolId}
            </p>
          </>
        ) : (
          <FormField id="schoolId" label="School ID" required helpText="Use the School ID provided by your administrator.">
            <input
              id="schoolId"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              name="schoolId"
              autoComplete="organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              disabled={isSubmitting}
              required
              value={schoolIdValue}
              onChange={(event) => setSchoolIdValue(normalizeSchoolCodeInput(event.target.value))}
              onBlur={() => setSchoolIdValue((current) => normalizeSchoolCodeForSubmit(current))}
            />
          </FormField>
        )}
        <FormField id="email" label="Email" required>
          <input
            id="email"
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            disabled={isSubmitting}
            required
            value={emailValue}
            onChange={(event) => setEmailValue(normalizeEmailInput(event.target.value))}
            onBlur={() => setEmailValue((current) => normalizeEmailForSubmit(current))}
          />
        </FormField>
        <FormField id="password" label="Password" required>
          <PasswordInput
            id="password"
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isSubmitting}
            required
          />
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
            Password is case-sensitive. A and a are different.
          </p>
        </FormField>
        <div className="flex justify-end">
          <Link href={recoveryHref} className="text-sm font-semibold text-brand-700 transition hover:text-brand-800 premium-focus">
            Forgot password?
          </Link>
        </div>
        <div className="flex justify-end">
          <Link href="/administrator/login" className="text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
            Administrator Login
          </Link>
        </div>
        {error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 shadow-sm">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="premium-primary-button min-h-12 w-full gap-2 text-base premium-focus disabled:cursor-not-allowed disabled:opacity-70"
          aria-live="polite"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
    </form>
  );
}
