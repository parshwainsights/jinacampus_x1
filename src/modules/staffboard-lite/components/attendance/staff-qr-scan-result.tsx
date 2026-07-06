import type { StaffQrScanActionData } from "@/modules/staffboard-lite/actions/staff-qr-scan.actions";
import {
  formatStaffAttendanceStatus,
  formatStaffQrPurpose,
  formatStaffScanDateTime
} from "./staff-qr-scan-state";

export function StaffQrScanResult({ result }: { result: StaffQrScanActionData }) {
  const rows = [
    { label: "Purpose", value: formatStaffQrPurpose(result.purpose) },
    { label: "Attendance date", value: result.attendanceDate },
    { label: "Status", value: formatStaffAttendanceStatus(result.status) },
    { label: "Check-in", value: formatStaffScanDateTime(result.checkInAt) },
    { label: "Check-out", value: formatStaffScanDateTime(result.checkOutAt) },
    { label: "Working minutes", value: typeof result.workingMinutes === "number" ? String(result.workingMinutes) : "-" }
  ];

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur" aria-labelledby="staff-scan-result-title">
      <h2 id="staff-scan-result-title" className="text-base font-semibold text-emerald-950">
        {result.message}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-emerald-100 bg-white/[0.85] p-3 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{row.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-950">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
