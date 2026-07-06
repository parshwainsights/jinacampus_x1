"use client";

import type { FocusEvent } from "react";
import { useState } from "react";
import {
  BookOpenCheck,
  Building2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileClock,
  Gauge,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListChecks,
  NotebookTabs,
  QrCode,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brandingInitials, type AppShellBranding } from "./branding";
import { getActiveNavHref, isNavItemActive, type MobileNavShortcut, type NavGroup } from "./navigation";

type SidebarNavProps = {
  groups: readonly NavGroup[];
  variant: "desktop" | "mobile";
  primaryItems?: readonly MobileNavShortcut[];
  branding?: AppShellBranding;
};

const navIconsByHref: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/campus-core/institutions": Landmark,
  "/campus-core/branches": Building2,
  "/campus-core/academic-years": CalendarCheck2,
  "/campus-core/users": UsersRound,
  "/campus-core/roles": ShieldCheck,
  "/campus-core/settings": Settings,
  "/campus-core/audit-logs": FileClock,
  "/academia": GraduationCap,
  "/academia/students": UsersRound,
  "/academia/guardians": UsersRound,
  "/academia/enrollments": NotebookTabs,
  "/academia/classes": BookOpenCheck,
  "/academia/sections": ListChecks,
  "/academia/class-sections": ClipboardList,
  "/academia/subjects": BookOpenCheck,
  "/academia/attendance": CalendarCheck2,
  "/academia/attendance/reports": ScrollText,
  "/staffboard": ClipboardList,
  "/staffboard/staff": UsersRound,
  "/staffboard/categories": ListChecks,
  "/staffboard/attendance": CalendarCheck2,
  "/staffboard/attendance/qr": QrCode,
  "/staffboard/attendance/scan": ScanLine,
  "/staffboard/attendance/reports": ScrollText
};

function IconForHref({ href, className }: { href: string; className?: string }) {
  const Icon = navIconsByHref[href] ?? Gauge;
  return <Icon aria-hidden="true" className={className ?? "h-4 w-4"} />;
}

function navItemClass(isActive: boolean, variant: SidebarNavProps["variant"], collapsed = false) {
  const base =
    "relative rounded-xl border text-sm font-semibold transition premium-focus";
  const state = isActive
    ? "border-brand-100 bg-brand-50/90 text-brand-800 shadow-sm shadow-brand-900/5 ring-1 ring-brand-100 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-brand-500 before:to-cyan-400"
    : "border-transparent text-slate-600 hover:border-white/70 hover:bg-white/80 hover:text-slate-950";

  if (variant === "mobile") {
    return `${base} ${state} flex min-h-11 w-full items-center gap-2 px-4 py-2.5`;
  }

  return `${base} ${state} flex min-h-11 items-center gap-3 py-2 ${collapsed ? "justify-center px-2" : "px-3"}`;
}

function handleSidebarBlur(event: FocusEvent<HTMLElement>, onBlurOutside: () => void) {
  const nextTarget = event.relatedTarget;
  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
  onBlurOutside();
}

export function SidebarNav({ groups, variant, primaryItems = [], branding }: SidebarNavProps) {
  const pathname = usePathname() ?? "/dashboard";
  const activeHref = getActiveNavHref(groups, pathname);
  const brandName = branding?.institutionName ?? "JinaCampus";
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  const [isRailActive, setIsRailActive] = useState(false);
  const isCollapsed = !isPinnedOpen && !isRailActive;

  if (variant === "mobile") {
    const activeItem = groups.flatMap((group) => group.items).find((item) => item.href === activeHref);
    return (
      <div className="border-b border-white/70 bg-white/80 px-3 py-3 shadow-sm shadow-slate-950/5 backdrop-blur-xl lg:hidden" data-mobile-navigation="true">
        {primaryItems.length > 0 ? (
          <nav
            aria-label="Primary mobile shortcuts"
            className="mb-3 grid grid-cols-2 gap-2 min-[390px]:grid-cols-3"
            data-role-mobile-shortcuts="true"
          >
            {primaryItems.map((item) => {
              const isActive = isNavItemActive(item, pathname, activeHref);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${navItemClass(isActive, "mobile")} justify-center text-center`}
                >
                  <IconForHref href={item.href} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
        <details className="rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-900 premium-focus [&::-webkit-details-marker]:hidden">
            <span>Menu</span>
            <span className="min-w-0 truncate text-xs font-medium text-slate-500">{activeItem?.title ?? "Dashboard"}</span>
          </summary>
          <nav
            className="premium-nav-scroll max-h-[min(70vh,34rem)] space-y-4 overflow-y-auto overflow-x-hidden scroll-smooth border-t border-slate-200/80 bg-white/90 p-3"
            aria-label="Mobile dashboard navigation"
            data-nav-scroll-area="mobile"
          >
            {groups.map((group) => (
              <div key={group.title}>
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
                <div className="mt-2 grid gap-2">
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(item, pathname, activeHref);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={navItemClass(isActive, "mobile")}
                      >
                        <IconForHref href={item.href} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </details>
      </div>
    );
  }

  return (
    <aside
      aria-label="Dashboard navigation"
      className={`sticky top-0 hidden h-screen max-h-screen shrink-0 flex-col overflow-hidden border-r border-white/70 bg-white/[0.72] py-5 shadow-[12px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-[width,padding] duration-200 ease-out motion-reduce:transition-none lg:flex ${isCollapsed ? "w-[5.25rem] px-3" : "w-72 px-4"}`}
      data-sidebar-collapsible="true"
      data-sidebar-state={isCollapsed ? "collapsed" : "expanded"}
      onBlur={(event) => handleSidebarBlur(event, () => setIsRailActive(false))}
      onFocus={() => {
        if (!isPinnedOpen) setIsRailActive(true);
      }}
      onMouseEnter={() => {
        if (!isPinnedOpen) setIsRailActive(true);
      }}
      onMouseLeave={() => {
        if (!isPinnedOpen) setIsRailActive(false);
      }}
    >
      <div className="shrink-0 pb-5">
        <div className={`flex min-w-0 items-center rounded-2xl border border-white/70 bg-white/[0.58] px-3 py-3 shadow-sm shadow-slate-950/5 transition-all duration-200 ${isCollapsed ? "justify-center" : "gap-3"}`}>
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt={`${brandName} logo`} className="h-10 w-10 shrink-0 rounded-2xl border border-white/80 object-cover shadow-sm" />
          ) : (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 ring-1 ring-white/70">
              {brandingInitials(brandName)}
            </span>
          )}
          <div className={isCollapsed ? "sr-only" : "min-w-0 transition-opacity duration-200"}>
            <div className="truncate text-lg font-semibold tracking-tight text-slate-950">{brandName}</div>
            <div className="truncate text-xs font-medium text-slate-500">JinaCampus School OS</div>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={isPinnedOpen ? "Collapse sidebar" : "Pin sidebar open"}
          aria-pressed={isPinnedOpen}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/70 px-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white hover:text-brand-700 premium-focus"
          data-sidebar-collapse-toggle="true"
          onClick={() => {
            setIsPinnedOpen((current) => !current);
            setIsRailActive(false);
          }}
        >
          {isPinnedOpen ? <ChevronLeft aria-hidden="true" className="h-4 w-4" /> : <ChevronRight aria-hidden="true" className="h-4 w-4" />}
          <span className={isCollapsed ? "sr-only" : "truncate"}>{isPinnedOpen ? "Compact rail" : "Keep open"}</span>
        </button>
      </div>
      <nav
        className="premium-nav-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden scroll-smooth pr-1"
        aria-label="Dashboard navigation"
        data-nav-scroll-area="desktop"
      >
        {groups.map((group) => (
          <div key={group.title}>
            <p className={isCollapsed ? "sr-only" : "px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400"}>{group.title}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const isActive = isNavItemActive(item, pathname, activeHref);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.title}
                    aria-current={isActive ? "page" : undefined}
                    className={navItemClass(isActive, "desktop", isCollapsed)}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${isActive ? "bg-white/90 text-brand-700 shadow-sm" : "bg-white/60 text-slate-500"}`}>
                      <IconForHref href={item.href} />
                    </span>
                    <span className={isCollapsed ? "sr-only" : "min-w-0 truncate"}>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
