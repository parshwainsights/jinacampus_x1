import type { ReactNode } from "react";

type MobileStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "indigo" | "cyan" | "green" | "amber" | "red" | "slate";
};

const toneClassName = {
  indigo: "from-indigo-50 to-white text-indigo-700",
  cyan: "from-cyan-50 to-white text-cyan-700",
  green: "from-emerald-50 to-white text-emerald-700",
  amber: "from-amber-50 to-white text-amber-700",
  red: "from-red-50 to-white text-red-700",
  slate: "from-slate-50 to-white text-slate-700",
};

export function MobileStatCard({ label, value, hint, tone = "slate" }: MobileStatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/80 bg-gradient-to-br ${toneClassName[tone]} p-4 shadow-sm shadow-slate-950/6`}
      data-mobile-stat-card="true"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-600">{hint}</p> : null}
    </div>
  );
}
