import type { ReactNode } from "react";
import Link from "next/link";

type MobileActionCardProps = {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
  tone?: "indigo" | "cyan" | "green" | "amber" | "slate";
  compact?: boolean;
};

const toneClassName = {
  indigo: "border-brand-100 bg-brand-50 text-brand-700",
  cyan: "border-teal-100 bg-teal-50 text-teal-700",
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
  compact = false,
}: MobileActionCardProps) {
  return (
    <Link
      href={href}
      className={`dashboard-glass-panel group flex min-w-0 gap-3 p-4 transition hover:border-brand-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${compact ? "min-h-28 flex-col items-start" : "min-h-[5.75rem] items-center"}`}
      data-mobile-action-card="true"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg border ${toneClassName[tone]} ${compact ? "h-10 w-10" : "h-12 w-12"}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-semibold text-slate-950">{title}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
        ) : null}
      </span>
    </Link>
  );
}
