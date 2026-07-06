import Link from "next/link";
import { CalendarDays, KeyRound, LogOut, MapPin, ShieldCheck, UserCircle } from "lucide-react";
import { brandingInitials, type AppShellBranding } from "./branding";

export type TopbarContext = {
  userEmail: string;
  hasActiveBranch: boolean;
  hasActiveAcademicYear: boolean;
};

export function Topbar({ context, branding }: { context: TopbarContext; branding: AppShellBranding }) {
  const visibleRoles = branding.roleLabels.slice(0, 2);
  const hiddenRoleCount = Math.max(branding.roleLabels.length - visibleRoles.length, 0);

  return (
    <header className="sticky top-0 z-20 min-w-0 border-b border-white/75 bg-white/[0.74] px-3 py-3 shadow-soft backdrop-blur-xl sm:px-6" data-topbar-glass="true">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={`${branding.institutionName} logo`} className="h-11 w-11 shrink-0 rounded-2xl border border-white/80 object-cover shadow-sm shadow-slate-950/10 ring-1 ring-slate-200/60" />
          ) : (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 ring-1 ring-white/70">
              {brandingInitials(branding.institutionName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{branding.institutionName}</p>
            <p className="truncate text-xs font-medium text-slate-500">JinaCampus School OS</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600 lg:justify-end">
          <span className="premium-muted-chip max-w-full gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
            <span className="min-w-0 truncate">
              Branch: {branding.branchName ? `${branding.branchName}${branding.branchCode ? ` (${branding.branchCode})` : ""}` : context.hasActiveBranch ? "Selected" : "Not selected"}
            </span>
          </span>
          <span className="premium-muted-chip max-w-full gap-1.5">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span className="min-w-0 truncate">
              Academic Year: {branding.academicYearName ?? (context.hasActiveAcademicYear ? "Active" : "Not active")}
            </span>
          </span>
          {visibleRoles.map((role) => (
            <span key={role} className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/90 px-3 py-1 font-semibold text-brand-700 shadow-sm shadow-brand-900/5 backdrop-blur">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{role}</span>
            </span>
          ))}
          {hiddenRoleCount > 0 ? (
            <span className="premium-muted-chip">+{hiddenRoleCount} more</span>
          ) : null}
          <details className="group relative min-w-0 max-w-full" data-topbar-account-menu="true">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-brand-100 hover:text-brand-700 premium-focus [&::-webkit-details-marker]:hidden">
              <UserCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="max-w-[13rem] truncate">{context.userEmail}</span>
            </summary>
            <div className="z-30 mt-2 w-full min-w-64 rounded-2xl border border-white/80 bg-white/95 p-2 text-sm shadow-elevated backdrop-blur-xl sm:absolute sm:right-0 sm:top-full sm:w-72" role="menu">
              <p className="truncate px-3 py-2 text-xs font-medium text-slate-500">{context.userEmail}</p>
              <Link href="/account/change-password" className="flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 premium-focus" role="menuitem">
                <KeyRound aria-hidden="true" className="h-4 w-4 shrink-0" />
                Change Password
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 premium-focus" type="submit" role="menuitem">
                  <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
