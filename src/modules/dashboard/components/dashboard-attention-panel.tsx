export type DashboardAttentionTone = "amber" | "rose" | "sky" | "slate";

export type DashboardAttentionItem = {
  label: string;
  value: number | string;
  description: string;
  tone?: DashboardAttentionTone;
};

type DashboardAttentionPanelProps = {
  items: readonly DashboardAttentionItem[];
};

const toneClasses: Record<DashboardAttentionTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  sky: "border-teal-200 bg-teal-50 text-teal-900",
  slate: "border-campus-border bg-white text-slate-800"
};

export function DashboardAttentionPanel({ items }: DashboardAttentionPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard attention items">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className={`motion-soft-hover min-w-0 rounded-lg border px-4 py-3 shadow-sm ${toneClasses[item.tone ?? "slate"]}`}
          data-dashboard-attention-item="true"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="shrink-0 rounded-full bg-white/75 px-2 py-0.5 text-sm font-semibold">{item.value}</p>
          </div>
          <p className="mt-1 text-sm leading-5 opacity-85">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
