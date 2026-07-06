import type { ReactNode } from "react";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function DashboardSection({ title, description, children }: DashboardSectionProps) {
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <section aria-labelledby={headingId} className="space-y-4" data-dashboard-section="true">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={headingId} className="text-base font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
