import { DashboardLiveClock } from "./dashboard-live-clock";

type DashboardPageHeaderProps = {
  userName?: string;
  activeAcademicYearName: string | null;
  branchLabel: string;
  dateLabel: string;
  timeZone?: string | null;
};

export function DashboardPageHeader({ userName, activeAcademicYearName, branchLabel, dateLabel, timeZone }: DashboardPageHeaderProps) {
  const yearLabel = activeAcademicYearName ?? "academic year not set";
  const overviewText = `Today's operational overview for ${branchLabel}, ${yearLabel}.`;
  const contextItems = [
    { label: "Academic year", value: activeAcademicYearName ?? "Not set" },
    { label: "Branch", value: branchLabel },
    { label: "Date", value: dateLabel }
  ];

  return (
    <header
      className="dashboard-glass-panel motion-slide-up relative min-w-0 overflow-hidden p-5 lg:p-6"
      data-dashboard-header="true"
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-brand-500" aria-hidden="true" />
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm font-semibold text-brand-700">{userName ? `Welcome back, ${userName}` : "School operations control center"}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">School Operations Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {overviewText}
          </p>
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:min-w-[640px] xl:grid-cols-4">
          <dl className="contents">
          {contextItems.map((item) => (
            <div key={item.label} className="motion-soft-hover min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm">
              <dt className="text-xs font-semibold uppercase text-slate-500">{item.label}</dt>
              <dd className="mt-1 truncate text-sm font-medium text-slate-800">{item.value}</dd>
            </div>
          ))}
          </dl>
          <DashboardLiveClock timeZone={timeZone} />
        </div>
      </div>
    </header>
  );
}
