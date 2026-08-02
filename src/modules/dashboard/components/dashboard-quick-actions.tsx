import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-dashboard-quick-actions="true">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          aria-label={`${action.label}: ${action.description}`}
          className="dashboard-glass-panel group motion-soft-hover flex min-h-24 p-4 transition hover:border-brand-200 hover:bg-white premium-focus"
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{action.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{action.description}</p>
            </div>
            <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
          </div>
        </Link>
      ))}
    </div>
  );
}
