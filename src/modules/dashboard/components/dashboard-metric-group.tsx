import type { ReactNode } from "react";

type DashboardMetricGroupProps = {
  title: string;
  description: string;
  columnsClassName: string;
  children: ReactNode;
};

export function DashboardMetricGroup({
  title,
  description,
  columnsClassName,
  children
}: DashboardMetricGroupProps) {
  return (
    <div className="min-w-0 space-y-3" data-dashboard-metric-group="true">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className={`grid gap-4 sm:grid-cols-2 ${columnsClassName}`}>{children}</div>
    </div>
  );
}
