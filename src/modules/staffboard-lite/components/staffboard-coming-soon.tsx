import { Clock3 } from "lucide-react";

type StaffboardComingSoonProps = {
  title: string;
  description: string;
  points: readonly string[];
};

export function StaffboardComingSoon({ title, description, points }: StaffboardComingSoonProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white/[0.86] p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur" aria-labelledby="staffboard-coming-soon-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Clock3 aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id="staffboard-coming-soon-title" className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
