import type { LucideIcon } from "lucide-react";

type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "amber" | "rose" | "sky" | "slate";
  emphasis?: "normal" | "attention";
};

const toneClasses = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  sky: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200"
} as const;

export function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "brand",
  emphasis = "normal"
}: DashboardMetricCardProps) {
  const emphasisClassName = emphasis === "attention" ? "border-amber-200 bg-amber-50/55" : "border-slate-200/80 bg-white/90";

  return (
    <div className={`motion-soft-hover min-w-0 rounded-2xl border p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur ${emphasisClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ${toneClasses[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {description ? <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p> : null}
    </div>
  );
}
