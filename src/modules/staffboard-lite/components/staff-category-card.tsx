import { UsersRound } from "lucide-react";
import type { StaffCategoryCard as StaffCategoryCardConfig } from "@/modules/staffboard-lite/ui-config";

export function StaffCategoryCard({ category }: { category: StaffCategoryCardConfig }) {
  return (
    <article className="premium-card p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <UsersRound aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{category.title}</h2>
          <p className="mt-1 text-xs font-medium uppercase text-slate-400">{category.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>
        </div>
      </div>
    </article>
  );
}
