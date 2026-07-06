import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { navItems } from "@/components/home/home-data";
import { focusRing } from "@/components/home/home-ui";

export function HomeNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className={`flex min-w-0 items-center gap-3 rounded-lg ${focusRing}`} aria-label="JinaCampus home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-base font-semibold text-white shadow-sm shadow-brand-900/20">
            JC
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold leading-5 text-slate-950">JinaCampus</span>
            <span className="block text-xs leading-5 text-slate-500">powered by Parshav Insights</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Homepage navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={`rounded-lg px-1 py-1 text-sm font-medium text-slate-600 transition hover:text-brand-900 ${focusRing}`}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-700 hover:bg-slate-50 hover:text-brand-900 ${focusRing}`}>
            Login
          </Link>
          <a href="#contact" className={`inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-900/10 transition hover:bg-brand-700 ${focusRing}`}>
            <span className="hidden sm:inline">Request Demo</span>
            <span className="sm:hidden">Demo</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8" aria-label="Homepage mobile navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className={`shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-100 hover:text-brand-900 ${focusRing}`}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
