type DashboardPageHeaderProps = {
  activeAcademicYearName: string | null;
  branchLabel: string;
  dateLabel: string;
};

export function DashboardPageHeader({ activeAcademicYearName, branchLabel, dateLabel }: DashboardPageHeaderProps) {
  const yearLabel = activeAcademicYearName ?? "academic year not set";
  const overviewText = `Today's operational overview for ${branchLabel}, ${yearLabel}.`;
  const contextItems = [
    { label: "Academic year", value: activeAcademicYearName ?? "Not set" },
    { label: "Branch", value: branchLabel },
    { label: "Date", value: dateLabel }
  ];

  return (
    <header
      className="premium-glass-panel motion-slide-up relative min-w-0 overflow-hidden p-4 sm:p-5 lg:p-6"
      data-dashboard-header="true"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-cyan-500 to-emerald-500" aria-hidden="true" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm font-semibold text-brand-700">School operations control center</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">JinaCampus Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {overviewText}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Check today's attendance, setup health, and the next operational actions from one calm view.
          </p>
        </div>
        <dl className="grid min-w-0 gap-2 sm:grid-cols-3 lg:min-w-[520px]">
          {contextItems.map((item) => (
            <div key={item.label} className="motion-soft-hover min-w-0 rounded-2xl border border-slate-200/80 bg-white/[0.72] px-3 py-2 shadow-sm backdrop-blur">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
              <dd className="mt-1 truncate text-sm font-medium text-slate-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
