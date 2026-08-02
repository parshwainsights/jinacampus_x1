import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserSafeErrorMessage } from "@/lib/errors";
import { getMobileStaffAttendanceStatus } from "@/lib/mobile-api/staff-attendance";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function MyStaffAttendancePage() {
  const ctx = await requireAuth();
  let result;
  try {
    result = await getMobileStaffAttendanceStatus(ctx);
  } catch (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Attendance" description="Your own staff attendance for today." />
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-900">
          {getUserSafeErrorMessage(error, "Unable to load your attendance.")}
        </p>
      </div>
    );
  }

  const attendance = result.attendance;
  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" description="Your own staff attendance for today." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/staffboard/attendance/scan" className="premium-primary-button min-h-11 w-full sm:w-auto">
          Scan attendance QR
        </Link>
        <Link href="/account/change-password" className="premium-secondary-button min-h-11 w-full sm:w-auto">
          Account and passkeys
        </Link>
      </div>
      {!attendance ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <p className="font-semibold text-slate-900">No attendance recorded yet today.</p>
          <p className="mt-2 text-sm text-slate-600">Use Scan QR when the school displays an active attendance code.</p>
        </div>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Status</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">{attendance.status.replaceAll("_", " ")}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Check in</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(attendance.checkInAt)}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Check out</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(attendance.checkOutAt)}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">Working minutes</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">{attendance.workingMinutes ?? "Pending"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
