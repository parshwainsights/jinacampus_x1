import { LogOut, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { brandingInitials, type AppShellBranding } from "./branding";
import type { TopbarContext } from "./topbar";

type MobileTopbarProps = {
  context: TopbarContext;
  branding: AppShellBranding;
};

export function MobileTopbar({ context, branding }: MobileTopbarProps) {
  const initials = brandingInitials(branding.institutionName);

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/92 px-3 py-3 shadow-sm shadow-slate-200/50 backdrop-blur lg:hidden"
      data-mobile-topbar="true"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3" aria-label="Open dashboard">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700 shadow-sm">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">
              {branding.institutionName}
            </span>
            <span className="block truncate text-xs text-slate-500">{context.userEmail}</span>
          </span>
        </Link>

        <details className="group relative shrink-0">
          <summary className="flex min-h-11 min-w-11 list-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Open account menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/12">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{context.userEmail}</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {branding.roleLabels.join(", ")}
              </p>
            </div>
            <Link
              href="/account/change-password"
              className="mt-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Account settings
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
