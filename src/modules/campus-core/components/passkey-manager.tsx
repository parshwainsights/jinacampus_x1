"use client";

import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/forms/password-input";

type PasskeySummary = {
  id: string;
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

const inputClassName = "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50";

function formatDate(value: string | null) {
  if (!value) return "Not used yet";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function PasskeyManager({ schoolId }: { schoolId?: string }) {
  const [credentials, setCredentials] = useState<PasskeySummary[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState<"load" | "register" | string | null>("load");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadCredentials() {
    try {
      const response = await fetch("/api/auth/passkey/credentials", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("LOAD_FAILED");
      setCredentials(Array.isArray(result.credentials) ? result.credentials : []);
    } catch {
      setError("Unable to load saved passkeys.");
    } finally {
      setPending(null);
    }
  }

  useEffect(() => {
    void loadCredentials();
  }, []);

  async function registerPasskey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!window.PublicKeyCredential || !navigator.credentials) {
      setError("Passkeys are not available in this browser.");
      return;
    }

    setPending("register");
    setError(null);
    setMessage(null);
    try {
      const optionsResponse = await fetch("/api/auth/passkey/registration/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword })
      });
      const optionsResult = await optionsResponse.json().catch(() => ({}));
      if (!optionsResponse.ok || !optionsResult.options) {
        throw new Error(typeof optionsResult.error === "string" ? optionsResult.error : "Unable to add a passkey.");
      }

      const options = optionsResult.options as PublicKeyCredentialCreationOptionsJSON;
      const response = await startRegistration({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/passkey/registration/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challenge: options.challenge,
          response,
          name: name.trim() || undefined
        })
      });
      const verifyResult = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok) {
        throw new Error(typeof verifyResult.error === "string" ? verifyResult.error : "Unable to add a passkey.");
      }

      setCurrentPassword("");
      setName("");
      setMessage("Passkey added. You can now use it for quick attendance sign in.");
      await loadCredentials();
    } catch (caught) {
      setError(caught instanceof Error && !caught.message.includes("_")
        ? caught.message
        : "Unable to add a passkey. Please retry or keep using your password.");
    } finally {
      setPending(null);
    }
  }

  async function removeCredential(credentialId: string) {
    if (pending) return;
    if (!currentPassword) {
      setError("Enter your current password before removing a passkey.");
      return;
    }
    setPending(credentialId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/passkey/credentials", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentialId, currentPassword })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Unable to remove this passkey.");
      }
      setCurrentPassword("");
      setCredentials((current) => current.filter((credential) => credential.id !== credentialId));
      setMessage("Passkey removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove this passkey.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-8 border-t border-slate-200 pt-8" aria-labelledby="passkey-heading">
      <div>
        <h2 id="passkey-heading" className="text-xl font-semibold text-slate-950">Trusted devices and passkeys</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use your device screen lock, fingerprint, or face verification for faster attendance sign-in. Your biometric data stays on your device.
        </p>
        <Link
          href={schoolId ? `/attendance-login?schoolId=${encodeURIComponent(schoolId)}` : "/attendance-login"}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal-700 transition hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          Open quick attendance sign in
        </Link>
      </div>

      <form onSubmit={registerPasskey} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Passkey name</span>
          <input
            className={inputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Office laptop or personal phone"
            disabled={Boolean(pending)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Current password</span>
          <PasswordInput
            className={inputClassName}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={Boolean(pending)}
          />
        </label>
        <button
          type="submit"
          disabled={Boolean(pending)}
          className="premium-primary-button min-h-11 w-full md:w-fit"
        >
          {pending === "register" ? "Adding passkey..." : "Add passkey"}
        </button>
      </form>

      {message ? <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {pending === "load" ? <p className="text-sm text-slate-500">Loading passkeys...</p> : null}
        {!pending && credentials.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600">
            No passkeys are registered. Password sign-in remains available.
          </p>
        ) : null}
        {credentials.map((credential) => (
          <div key={credential.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">{credential.name ?? "Passkey"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Added {formatDate(credential.createdAt)} | Last used {formatDate(credential.lastUsedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeCredential(credential.id)}
              disabled={Boolean(pending)}
              className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {pending === credential.id ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
