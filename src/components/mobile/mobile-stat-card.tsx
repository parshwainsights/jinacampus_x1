import type { ReactNode } from "react";

type MobileStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  progress?: number | null;
  tone?: "indigo" | "cyan" | "green" | "amber" | "red" | "slate";
};

const toneClassName = {
  indigo: "bg-brand-50 text-brand-700 ring-brand-100",
  cyan: "bg-teal-50 text-teal-700 ring-teal-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
};

const progressClassName = {
  indigo: "bg-brand-500",
  cyan: "bg-campus-teal",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  slate: "bg-slate-400",
};

export function MobileStatCard({ label, value, hint, icon, progress, tone = "slate" }: MobileStatCardProps) {
  const normalizedProgress = progress === null || progress === undefined ? null : Math.max(0, Math.min(progress, 100));

  return (
    <article
      className="dashboard-glass-panel min-w-0 p-3.5"
      data-mobile-stat-card="true"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold text-slate-500">{label}</p>
        {icon ? <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClassName[tone]}`}>{icon}</span> : null}
      </div>
      <p className="tabular-nums mt-2 break-words text-xl font-semibold text-ink sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-600">{hint}</p> : null}
      {normalizedProgress !== null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizedProgress}>
          <div className={`h-full rounded-full ${progressClassName[tone]}`} style={{ width: `${normalizedProgress}%` }} />
        </div>
      ) : null}
    </article>
  );
}
