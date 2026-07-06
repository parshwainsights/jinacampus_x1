import type { ReactNode } from "react";

type MobileListCardMeta = {
  label: string;
  value: ReactNode;
};

type MobileListCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  meta?: MobileListCardMeta[];
  actions?: ReactNode;
};

export function MobileListCard({ title, subtitle, status, meta = [], actions }: MobileListCardProps) {
  return (
    <article
      className="rounded-2xl border border-white/80 bg-white/92 p-4 shadow-sm shadow-slate-950/6"
      data-mobile-list-card="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {meta.length > 0 ? (
        <dl className="mt-4 grid gap-2 text-xs">
          {meta.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <dt className="font-medium text-slate-500">{item.label}</dt>
              <dd className="min-w-0 text-right font-semibold text-slate-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}
