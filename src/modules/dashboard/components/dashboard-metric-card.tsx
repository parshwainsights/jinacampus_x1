import type { LucideIcon } from "lucide-react";

type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "amber" | "rose" | "sky" | "slate";
  emphasis?: "normal" | "attention";
  progress?: number | null;
  supportingValue?: string;
};

const toneClasses = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  sky: "bg-teal-50 text-teal-700 ring-teal-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200"
} as const;

export function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "brand",
  emphasis = "normal",
  progress,
  supportingValue
}: DashboardMetricCardProps) {
  const emphasisClassName = emphasis === "attention" ? "border-amber-200 bg-amber-50/85" : "border-white/80 bg-white/80";
  const normalizedProgress = progress === null || progress === undefined ? null : Math.max(0, Math.min(progress, 100));

  return (
    <article className={`dashboard-metric-card motion-soft-hover min-w-0 rounded-lg border p-4 ${emphasisClassName}`} data-dashboard-metric-card="true">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="tabular-nums mt-2 break-words text-2xl font-semibold text-ink">{value}</p>
        </div>
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ${toneClasses[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {description ? <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p> : null}
      {normalizedProgress !== null ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
            <span>{supportingValue ?? "Progress"}</span>
            <span className="tabular-nums">{normalizedProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizedProgress}>
            <div className={`h-full rounded-full ${tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "rose" ? "bg-rose-500" : tone === "sky" ? "bg-campus-teal" : "bg-brand-500"}`} style={{ width: `${normalizedProgress}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
