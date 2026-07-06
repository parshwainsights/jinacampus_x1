import type { ReactNode } from "react";
import Link from "next/link";

type MobileActionCardProps = {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
  tone?: "indigo" | "cyan" | "green" | "amber" | "slate";
};

const toneClassName = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export function MobileActionCard({
  title,
  description,
  href,
  icon,
  tone = "indigo",
}: MobileActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[5.75rem] items-center gap-3 rounded-2xl border border-white/80 bg-white/92 p-4 shadow-sm shadow-slate-950/6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      data-mobile-action-card="true"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClassName[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
        ) : null}
      </span>
    </Link>
  );
}
