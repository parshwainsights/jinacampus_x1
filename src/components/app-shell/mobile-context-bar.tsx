import { Building2, CalendarDays } from "lucide-react";

import type { AppShellBranding } from "./branding";
import type { TopbarContext } from "./topbar";

type MobileContextBarProps = {
  context: TopbarContext;
  branding: AppShellBranding;
};

export function MobileContextBar({ context, branding }: MobileContextBarProps) {
  const branchLabel = branding.branchName
    ? `${branding.branchName}${branding.branchCode ? ` (${branding.branchCode})` : ""}`
    : context.hasActiveBranch
      ? "Selected branch"
      : "Branch not selected";
  const academicYearLabel =
    branding.academicYearName ?? (context.hasActiveAcademicYear ? "Active academic year" : "Academic year not active");

  return (
    <div
      className="flex gap-2 overflow-x-auto border-b border-slate-200/70 bg-white/80 px-3 py-2 text-xs text-slate-600 backdrop-blur lg:hidden"
      data-mobile-context-bar="true"
    >
      <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 font-medium text-slate-700">
        <Building2 className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
        <span className="max-w-[11rem] truncate">{branchLabel}</span>
      </span>
      <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 font-medium text-slate-700">
        <CalendarDays className="h-3.5 w-3.5 text-cyan-600" aria-hidden="true" />
        <span className="max-w-[11rem] truncate">{academicYearLabel}</span>
      </span>
    </div>
  );
}
