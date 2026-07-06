"use client";

import { useState, useTransition } from "react";
import { ErrorState } from "@/components/ui/empty-state";
import type { StaffQrScanActionData } from "@/modules/staffboard-lite/actions/staff-qr-scan.actions";
import { scanStaffAttendanceQrAction } from "@/modules/staffboard-lite/actions/staff-qr-scan.actions";
import { StaffQrManualTokenInput } from "./staff-qr-manual-token-input";
import { StaffQrCameraScanner } from "./staff-qr-camera-scanner";
import { StaffQrScanResult } from "./staff-qr-scan-result";
import { staffQrScanErrorMessage } from "./staff-qr-scan-state";

type StaffQrScanFormProps = {
  variant?: "default" | "mobile";
};

export function StaffQrScanForm({ variant = "default" }: StaffQrScanFormProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [result, setResult] = useState<StaffQrScanActionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitRawQrPayload(qrPayload: string) {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const actionResult = await scanStaffAttendanceQrAction({ qrPayload });
      setTokenInput("");

      if (actionResult.ok) {
        setResult(actionResult.data);
        setError(null);
      } else {
        setResult(null);
        setError(staffQrScanErrorMessage(actionResult.code, actionResult.error));
      }
    });
  }

  function submitScan() {
    const qrPayload = tokenInput.trim();
    if (!qrPayload) {
      setResult(null);
      setError("QR payload is empty. Scan the staff attendance QR or use manual token entry.");
      return;
    }

    submitRawQrPayload(qrPayload);
  }

  const isMobile = variant === "mobile";

  return (
    <div className={isMobile ? "space-y-4" : "space-y-5"}>
      <StaffQrCameraScanner disabled={isPending} variant={variant} onQrPayloadDetected={submitRawQrPayload} />

      <section
        className={isMobile ? "rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-950/6" : "premium-card p-4 sm:p-5"}
        aria-labelledby="staff-scan-form-title"
      >
        <div>
          <h2 id="staff-scan-form-title" className={isMobile ? "text-base font-semibold text-slate-950" : "text-lg font-semibold text-slate-950"}>
            Manual token entry
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Use this fallback when camera permission is denied, the browser is unsupported, or you are testing from desktop.
          </p>
        </div>

        <div className={isMobile ? "mt-4" : "mt-5"}>
          <StaffQrManualTokenInput value={tokenInput} disabled={isPending} compact={isMobile} onChange={setTokenInput} />
        </div>

        <div className={`mt-5 grid gap-3 ${isMobile ? "" : "sm:flex sm:items-center"}`}>
          <button
            type="button"
            onClick={submitScan}
            disabled={isPending}
            className={`premium-primary-button w-full min-h-12 premium-focus ${isMobile ? "text-base" : "sm:w-auto"}`}
          >
            {isPending ? "Submitting scan..." : "Submit Scan"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput("");
              setError(null);
              setResult(null);
            }}
            disabled={isPending}
            className={`premium-secondary-button w-full min-h-12 premium-focus ${isMobile ? "text-base" : "sm:w-auto"}`}
          >
            Reset
          </button>
        </div>
      </section>

      {error ? <ErrorState title="Scan could not be completed" description={error} /> : null}

      {result ? <StaffQrScanResult result={result} /> : null}
    </div>
  );
}
