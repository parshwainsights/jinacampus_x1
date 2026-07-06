import { ShieldCheck, Smartphone } from "lucide-react";

export function StaffQrScanHelpCard() {
  return (
    <aside className="space-y-4" aria-label="Staff QR scan guidance">
      <section className="premium-card p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Smartphone aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="text-base font-semibold text-slate-950">How to scan</h2>
        </div>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>1. Open this page on your signed-in staff account.</li>
          <li>2. Scan the QR displayed at the school office or gate.</li>
          <li>3. Submit the token to mark check-in or check-out.</li>
        </ol>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-amber-700">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="text-base font-semibold text-amber-950">Security rules</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
          <li>QR codes are time-bound and branch-scoped.</li>
          <li>Use only the QR displayed at your assigned branch.</li>
          <li>Contact the office if the QR is expired or scan fails.</li>
        </ul>
      </section>
    </aside>
  );
}
