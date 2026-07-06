"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordInput } from "@/components/forms/password-input";
import { FormField } from "@/components/ui/form-primitives";
import { ADMINISTRATOR_LOGIN_ERROR_MESSAGE } from "@/modules/campus-core/tenant-login-policy";

export function AdministratorLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/administrator-login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (!response.ok) {
      setError(ADMINISTRATOR_LOGIN_ERROR_MESSAGE);
      setIsSubmitting(false);
      return;
    }

    const result = await response.json().catch(() => ({}));
    const redirectTo =
      typeof result.redirectTo === "string" && result.redirectTo.startsWith("/") && !result.redirectTo.startsWith("//")
        ? result.redirectTo
        : "/administrator";
    window.location.href = redirectTo;
  }

  return (
    <form onSubmit={onSubmit} className="premium-glass-panel box-border min-w-0 w-[calc(100vw-2rem)] max-w-72 overflow-hidden p-5 sm:w-full sm:max-w-md sm:p-8">
      <div className="space-y-2">
        <span className="inline-flex min-h-9 items-center rounded-full border border-cyan-200 bg-cyan-50/90 px-3 text-xs font-semibold uppercase tracking-wide text-cyan-700">
          Platform Portal
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">JinaCampus Administrator</h1>
        <p className="text-sm leading-6 text-slate-500">Platform administration portal for authorized JinaCampus Super Admin users.</p>
      </div>

      <div className="mt-8 space-y-4">
        <FormField id="administrator-email" label="Email" required>
          <input id="administrator-email" className="min-h-11 w-full" name="email" type="email" autoComplete="username" disabled={isSubmitting} required />
        </FormField>
        <FormField id="administrator-password" label="Password" required>
          <PasswordInput id="administrator-password" className="min-h-11 w-full" name="password" autoComplete="current-password" disabled={isSubmitting} required />
        </FormField>
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm">{error}</p> : null}
        <button disabled={isSubmitting} className="premium-primary-button w-full premium-focus">
          {isSubmitting ? "Signing in..." : "Sign in to Administrator Portal"}
        </button>
        <div className="flex justify-center">
          <Link href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-brand-700 premium-focus">
            Back to School Login
          </Link>
        </div>
      </div>
    </form>
  );
}
