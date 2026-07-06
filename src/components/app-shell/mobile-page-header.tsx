import type { ReactNode } from "react";

type MobilePageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function MobilePageHeader({ eyebrow, title, description, action }: MobilePageHeaderProps) {
  return (
    <div className="space-y-3 lg:hidden" data-mobile-page-header="true">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
