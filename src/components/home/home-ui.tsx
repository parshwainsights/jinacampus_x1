import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

type IconBadgeProps = {
  icon: LucideIcon;
  tone?: "brand" | "green" | "blue" | "amber" | "slate";
};

const iconToneClass = {
  brand: "bg-brand-50 text-brand-900 ring-brand-100",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  blue: "bg-sky-50 text-sky-800 ring-sky-100",
  amber: "bg-amber-50 text-amber-800 ring-amber-100",
  slate: "bg-slate-100 text-slate-800 ring-slate-200"
} as const;

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2";

export const primaryLinkClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-900 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-900/10 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md ${focusRing}`;

export const secondaryLinkClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-700 hover:text-brand-900 hover:shadow-md ${focusRing}`;

export const cardClass =
  "rounded-lg border border-slate-200/80 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-lg hover:shadow-slate-200/70";

export function HomeContainer({ children, className = "" }: ContainerProps) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function IconBadge({ icon: Icon, tone = "brand" }: IconBadgeProps) {
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${iconToneClass[tone]}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}
