import type { StaffAttendanceDailySummary } from "@/modules/staffboard-lite/queries";

export function StaffAttendanceSummaryCards({ summary }: { summary: StaffAttendanceDailySummary }) {
  const cards = [
    { label: "Total Staff", value: summary.totalStaff },
    { label: "Checked In", value: summary.checkedIn },
    { label: "Present", value: summary.present },
    { label: "Late", value: summary.late },
    { label: "Half Day", value: summary.halfDay },
    { label: "Absent / Not Marked", value: summary.absentNotMarked },
    { label: "On Leave / Holiday", value: summary.onLeaveHoliday }
  ];

  return (
    <section aria-labelledby="staff-attendance-summary-title" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <h2 id="staff-attendance-summary-title" className="sr-only">
        Daily staff attendance summary
      </h2>
      {cards.map((card) => (
        <div key={card.label} className="premium-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
