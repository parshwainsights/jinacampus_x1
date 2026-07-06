import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardQuickAction } from "./dashboard-state";
import { DashboardEmptyState } from "./dashboard-empty-state";

type DashboardQuickActionsProps = {
  actions: readonly DashboardQuickAction[];
};

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  if (actions.length === 0) {
    return (
      <DashboardEmptyState
        title="No quick actions available"
        description="Your current permissions do not include an operational shortcut for this dashboard."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-dashboard-quick-actions="true">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          aria-label={`${action.label}: ${action.description}`}
          className="group motion-soft-hover flex min-h-28 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur transition hover:border-brand-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] premium-focus"
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{action.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{action.description}</p>
            </div>
            <ArrowRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
          </div>
        </Link>
      ))}
    </div>
  );
}
