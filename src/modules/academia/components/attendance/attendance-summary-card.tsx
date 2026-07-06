import type { SubmitDailyStudentAttendanceResult } from "@/modules/academia/services/student-attendance.service";

const summaryFields = [
  ["Total active", "totalActiveStudents"],
  ["Submitted", "submittedCount"],
  ["Present", "presentCount"],
  ["Absent", "absentCount"],
  ["Late", "lateCount"],
  ["Half-day", "halfDayCount"],
  ["On leave", "onLeaveCount"],
  ["Excused", "excusedCount"],
  ["Created", "createdCount"],
  ["Updated", "updatedCount"]
] as const satisfies readonly [string, keyof SubmitDailyStudentAttendanceResult][];

export function AttendanceSummaryCard({ summary }: { summary: SubmitDailyStudentAttendanceResult | null }) {
  if (!summary) return null;

  return (
    <section aria-label="Submission summary" className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur">
      <div>
        <h2 className="text-base font-semibold text-emerald-950">Attendance submitted</h2>
        <p className="mt-1 text-sm text-emerald-800">
          {summary.attendanceDate} · {summary.sessionType.replace(/_/g, " ")}
        </p>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryFields.map(([label, key]) => (
          <div key={key} className="rounded-2xl border border-emerald-100 bg-white/[0.85] px-3 py-2 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</dt>
            <dd className="mt-1 text-lg font-semibold text-emerald-950">{summary[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
