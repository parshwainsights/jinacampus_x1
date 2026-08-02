"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/server";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";

type LoginFormProps = {
  schoolId: string | null;
  schoolIdLocked: boolean;
  schoolName: string | null;
  logoUrl: string | null;
  intent?: "standard" | "attendance";
  successRedirect?: string;
};

type PendingAction = "passkey" | "password" | null;

const LOGIN_ERROR_MESSAGE = "Login failed. Please check your credentials.";
const PASSKEY_ERROR_MESSAGE = "Passkey sign-in failed. Use your employee code and password.";

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

function normalizeIdentifier(value: string) {
  const trimmed = value.trim();
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed.toUpperCase();
}

function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function resolvedLoginRedirect(serverRedirect: unknown, successRedirect?: string) {
  const redirectTo = safeRedirect(serverRedirect);
  if (
    redirectTo.startsWith("/account/change-password") ||
    redirectTo.startsWith("/administrator")
  ) {
    return redirectTo;
  }
  return successRedirect ? safeRedirect(successRedirect) : redirectTo;
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

function PasskeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8.5" cy="8.5" r="4.5" />
      <path d="m12 12 8 8m-3-3 2-2m-5-1 2-2" />
    </svg>
  );
}

export function LoginForm({
  schoolId,
  schoolIdLocked,
  schoolName,
  logoUrl,
  intent = "standard",
  successRedirect
}: LoginFormProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [schoolIdValue, setSchoolIdValue] = useState(schoolId ?? "");
  const [identifier, setIdentifier] = useState("");
  const isPending = pendingAction !== null;
  const displayName = schoolName ?? "your school";
  const recoveryHref = schoolId ? `/forgot-password?schoolId=${encodeURIComponent(schoolId)}` : "/forgot-password";
  const attendanceIntent = intent === "attendance";
  const attendanceLoginHref = schoolId
    ? `/attendance-login?schoolId=${encodeURIComponent(schoolId)}`
    : "/attendance-login";
  const standardLoginHref = schoolId ? `/?schoolId=${encodeURIComponent(schoolId)}` : "/";

  function normalizedSchoolId() {
    const normalized = normalizeSchoolCodeForSubmit(schoolIdValue);
    if (!schoolIdLocked) setSchoolIdValue(normalized);
    return normalized;
  }

  function normalizedIdentity() {
    const normalized = normalizeIdentifier(identifier);
    setIdentifier(normalized);
    return normalized;
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setPendingAction("password");
    setError(null);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug: normalizedSchoolId(),
          identifier: normalizedIdentity(),
          password: formData.get("password")
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(LOGIN_ERROR_MESSAGE);
        setPendingAction(null);
        return;
      }
      window.location.assign(resolvedLoginRedirect(result.redirectTo, successRedirect));
    } catch {
      setError(LOGIN_ERROR_MESSAGE);
      setPendingAction(null);
    }
  }

  async function onPasskeySignIn() {
    if (isPending) return;
    const tenantSlug = normalizedSchoolId();
    const normalizedIdentifier = normalizedIdentity();
    if (!tenantSlug || !normalizedIdentifier) {
      setError("Enter your School ID and employee code or email.");
      return;
    }
    if (!window.PublicKeyCredential || !navigator.credentials) {
      setError("Passkeys are not available in this browser. Use your password.");
      return;
    }

    setPendingAction("passkey");
    setError(null);
    try {
      const optionsResponse = await fetch("/api/auth/passkey/authentication/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantSlug, identifier: normalizedIdentifier })
      });
      const optionsResult = await optionsResponse.json().catch(() => ({}));
      if (!optionsResponse.ok || !optionsResult.options) throw new Error("PASSKEY_OPTIONS_FAILED");

      const options = optionsResult.options as PublicKeyCredentialRequestOptionsJSON;
      const credential = await startAuthentication({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/passkey/authentication/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          challenge: options.challenge,
          response: credential
        })
      });
      const verifyResult = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok) throw new Error("PASSKEY_VERIFY_FAILED");
      window.location.assign(resolvedLoginRedirect(verifyResult.redirectTo, successRedirect));
    } catch {
      setError(PASSKEY_ERROR_MESSAGE);
      setPendingAction(null);
    }
  }

  return (
    <section
      className="auth-form-panel p-5 sm:p-8 lg:p-9"
      data-mobile-login-form="true"
      data-auth-pending={isPending ? "true" : "false"}
      aria-busy={isPending}
    >
      <BrandLogo className="mx-auto hidden w-[17rem] lg:block" priority />
      <div className="text-left lg:mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-brand-700">Secure school access</p>
          {attendanceIntent ? (
            <p className="inline-flex min-h-8 items-center rounded-full border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800">
              Fast attendance sign in
            </p>
          ) : null}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the School ID and account details provided by your institution.</p>
        {attendanceIntent ? (
          <p className="mt-3 text-sm font-medium leading-6 text-teal-800">
            Use a registered passkey for the quickest route to staff attendance.
          </p>
        ) : null}
        {logoUrl || schoolName ? (
          <div className="auth-context-row mt-5 flex min-h-14 items-center gap-3 px-4 py-3">
            {logoUrl ? <img src={logoUrl} alt={`${displayName} logo`} className="h-11 w-11 shrink-0 rounded-[0.9rem] border border-white object-cover shadow-sm" /> : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">School workspace</p>
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onPasswordSubmit} className="mt-6 space-y-4" aria-label="JinaCampus sign in">
        {schoolIdLocked ? (
          <>
            <input type="hidden" name="schoolId" value={schoolId ?? ""} />
            <p className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
              School ID: {schoolId}
            </p>
          </>
        ) : (
          <FormField id="schoolId" label="School ID" required helpText="Use the School ID provided by your administrator.">
            <input
              id="schoolId"
              className="auth-field-input w-full outline-none transition disabled:bg-slate-50"
              autoComplete="organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              disabled={isPending}
              required
              value={schoolIdValue}
              onChange={(event) => setSchoolIdValue(normalizeSchoolCodeInput(event.target.value))}
              onBlur={() => setSchoolIdValue((current) => normalizeSchoolCodeForSubmit(current))}
            />
          </FormField>
        )}

        <FormField
          id="identifier"
          label="Employee code or email"
          required
          helpText="Staff can use the employee code on their profile. Email login remains supported."
        >
          <input
            id="identifier"
            className="auth-field-input w-full outline-none transition disabled:bg-slate-50"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isPending}
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            onBlur={() => setIdentifier((current) => normalizeIdentifier(current))}
          />
        </FormField>

        <button
          type="button"
          onClick={onPasskeySignIn}
          disabled={isPending}
          className="auth-action-button auth-action-primary premium-focus"
          aria-live="polite"
        >
          {pendingAction === "passkey"
            ? <><LoadingSpinner />Checking passkey...</>
            : <><PasskeyIcon />{attendanceIntent ? "Open attendance with passkey" : "Sign in with passkey"}</>}
        </button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase text-slate-400">Password fallback</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <FormField id="password" label="Password" required>
          <PasswordInput
            id="password"
            className="auth-field-input w-full outline-none transition disabled:bg-slate-50"
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isPending}
            required
          />
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">Password is case-sensitive. A and a are different.</p>
        </FormField>

        <div className="flex justify-end">
          <Link href={recoveryHref} className="inline-flex min-h-12 items-center text-sm font-semibold text-brand-700 transition hover:text-brand-800 premium-focus">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={isPending} className="auth-action-button auth-action-secondary premium-focus" aria-live="polite">
          {pendingAction === "password"
            ? <><LoadingSpinner />Signing in...</>
            : attendanceIntent ? "Continue to attendance" : "Sign in with password"}
        </button>

        {error ? (
          <p role="alert" className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 shadow-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-center">
          {attendanceIntent ? (
            <Link href={standardLoginHref} className="inline-flex min-h-12 items-center text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
              Back to standard sign in
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link href={attendanceLoginHref} className="inline-flex min-h-12 items-center text-sm font-semibold text-teal-700 transition hover:text-teal-800 premium-focus">
                Quick attendance sign in
              </Link>
              <Link href="/administrator/login" className="inline-flex min-h-12 items-center text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
                Administrator Login
              </Link>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
