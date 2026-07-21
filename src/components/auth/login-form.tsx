"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";

type LoginFormProps = {
  schoolId: string | null;
  schoolIdLocked: boolean;
  schoolName: string | null;
  logoUrl: string | null;
};

type LoginMode = "password" | "otp";
type PendingAction = "password" | "requestOtp" | "verifyOtp" | null;

const LOGIN_ERROR_MESSAGE = "Login failed. Please check your credentials.";
const OTP_REQUEST_ERROR_MESSAGE = "Unable to request an OTP. Please try again.";
const OTP_VERIFY_ERROR_MESSAGE = "OTP verification failed. Check the code and try again.";
const OTP_RESEND_SECONDS = 60;

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

function normalizePhoneInput(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized.startsWith("+")
    ? `+${normalized.slice(1).replace(/\+/g, "")}`
    : normalized.replace(/\+/g, "");
}

function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
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
  const [mode, setMode] = useState<LoginMode>("password");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [schoolIdValue, setSchoolIdValue] = useState(schoolId ?? "");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const isPending = pendingAction !== null;
  const displayName = schoolName ?? "your school";
  const recoveryHref = schoolId ? `/forgot-password?schoolId=${encodeURIComponent(schoolId)}` : "/forgot-password";

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function selectMode(nextMode: LoginMode) {
    if (isPending) return;
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  function normalizedSchoolId() {
    const normalized = normalizeSchoolCodeForSubmit(schoolIdValue);
    if (!schoolIdLocked) setSchoolIdValue(normalized);
    return normalized;
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setPendingAction("password");
    setError(null);
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    const normalizedTenantSlug = normalizedSchoolId();
    const normalizedEmail = normalizeEmailForSubmit(String(formData.get("email") ?? ""));
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
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(LOGIN_ERROR_MESSAGE);
        setPendingAction(null);
        return;
      }
      window.location.href = safeRedirect(result.redirectTo);
    } catch {
      setError(LOGIN_ERROR_MESSAGE);
      setPendingAction(null);
    }
  }

  async function requestOtp() {
    if (isPending || (otpRequested && resendSeconds > 0)) return;
    setPendingAction("requestOtp");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug: normalizedSchoolId(),
          phone: phoneValue,
          purpose: "ADMIN_LOGIN"
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(OTP_REQUEST_ERROR_MESSAGE);
        setPendingAction(null);
        return;
      }
      setOtpRequested(true);
      setOtpValue("");
      setResendSeconds(OTP_RESEND_SECONDS);
      setNotice(typeof result.message === "string" ? result.message : "If the number is registered, an OTP has been sent.");
      setPendingAction(null);
    } catch {
      setError(OTP_REQUEST_ERROR_MESSAGE);
      setPendingAction(null);
    }
  }

  async function onOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    if (!otpRequested) {
      await requestOtp();
      return;
    }

    setPendingAction("verifyOtp");
    setError(null);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantSlug: normalizedSchoolId(),
          phone: phoneValue,
          otp: otpValue,
          purpose: "ADMIN_LOGIN"
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(OTP_VERIFY_ERROR_MESSAGE);
        setPendingAction(null);
        return;
      }
      window.location.href = safeRedirect(result.redirectTo);
    } catch {
      setError(OTP_VERIFY_ERROR_MESSAGE);
      setPendingAction(null);
    }
  }

  return (
    <section
      className="premium-glass-panel box-border w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[1.75rem] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:w-full sm:p-8"
      data-mobile-login-form="true"
    >
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/90 shadow-lg shadow-brand-900/10 ring-1 ring-slate-200/60">
          <img src="/brand/jinacampus-mark-transparent.png" alt="JinaCampus logo" className="h-16 w-16 object-contain" />
        </div>
        <div className="mt-4 min-w-0">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">JinaCampus</h1>
          <p className="mt-1 text-base font-semibold text-brand-700">The Complete School OS</p>
          <p className="mt-1 max-w-full break-words text-sm leading-5 text-slate-500">powered by Parshav Insights</p>
          <p className="mt-3 text-sm leading-5 text-slate-600">Secure access for your school account.</p>
        </div>
        {logoUrl || schoolName ? (
          <div className="mt-5 flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/78 px-3 py-2 text-left">
            {logoUrl ? <img src={logoUrl} alt={`${displayName} logo`} className="h-9 w-9 shrink-0 rounded-xl border border-slate-100 object-cover" /> : null}
            <p className="min-w-0 truncate text-sm font-semibold text-slate-700">{displayName}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Login method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          disabled={isPending}
          onClick={() => selectMode("password")}
          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition premium-focus ${mode === "password" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}
        >
          Email & password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "otp"}
          disabled={isPending}
          onClick={() => selectMode("otp")}
          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition premium-focus ${mode === "otp" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}
        >
          OTP login
        </button>
      </div>

      <div className="mt-5 space-y-4">
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
              disabled={isPending}
              required
              value={schoolIdValue}
              onChange={(event) => setSchoolIdValue(normalizeSchoolCodeInput(event.target.value))}
              onBlur={() => setSchoolIdValue((current) => normalizeSchoolCodeForSubmit(current))}
            />
          </FormField>
        )}

        {mode === "password" ? (
          <form onSubmit={onPasswordSubmit} className="space-y-4" aria-label="Email and password login">
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
                disabled={isPending}
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
                disabled={isPending}
                required
              />
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">Password is case-sensitive. A and a are different.</p>
            </FormField>
            <div className="flex justify-end">
              <Link href={recoveryHref} className="text-sm font-semibold text-brand-700 transition hover:text-brand-800 premium-focus">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={isPending} className="premium-primary-button min-h-12 w-full gap-2 text-base premium-focus disabled:cursor-not-allowed disabled:opacity-70" aria-live="polite">
              {pendingAction === "password" ? <><LoadingSpinner />Signing in...</> : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={onOtpSubmit} className="space-y-4" aria-label="Administrator OTP login">
            <FormField id="otp-phone" label="Contact number" required helpText="OTP login is available to tenant owners and school admins.">
              <input
                id="otp-phone"
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isPending || otpRequested}
                required
                value={phoneValue}
                onChange={(event) => setPhoneValue(normalizePhoneInput(event.target.value))}
                placeholder="+91 98765 43210"
              />
            </FormField>
            {otpRequested ? (
              <FormField id="otp-code" label="6-digit OTP" required>
                <input
                  id="otp-code"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-slate-950 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  pattern="[0-9]{6}"
                  maxLength={6}
                  disabled={isPending}
                  required
                  value={otpValue}
                  onChange={(event) => setOtpValue(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </FormField>
            ) : null}
            <button type="submit" disabled={isPending} className="premium-primary-button min-h-12 w-full gap-2 text-base premium-focus disabled:cursor-not-allowed disabled:opacity-70" aria-live="polite">
              {pendingAction === "requestOtp" ? <><LoadingSpinner />Sending OTP...</> : pendingAction === "verifyOtp" ? <><LoadingSpinner />Verifying...</> : otpRequested ? "Verify & sign in" : "Send OTP"}
            </button>
            {otpRequested ? (
              <button
                type="button"
                onClick={requestOtp}
                disabled={isPending || resendSeconds > 0}
                className="premium-secondary-button min-h-11 w-full premium-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : "Resend OTP"}
              </button>
            ) : null}
          </form>
        )}

        {notice ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">{notice}</p> : null}
        {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 shadow-sm">{error}</p> : null}
        <div className="flex justify-center">
          <Link href="/administrator/login" className="text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
            Administrator Login
          </Link>
        </div>
      </div>
    </section>
  );
}
