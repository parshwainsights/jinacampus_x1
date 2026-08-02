"use client";

import type { FocusEvent } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMark } from "@/components/brand/app-mark";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { AppShellBranding } from "./branding";
import { NavigationIcon } from "./navigation-icon";
import { getActiveNavHref, isNavItemActive, type MobileNavShortcut, type NavGroup } from "./navigation";

type SidebarNavProps = {
  groups: readonly NavGroup[];
  variant: "desktop" | "mobile";
  primaryItems?: readonly MobileNavShortcut[];
  branding?: AppShellBranding;
};

function navItemClass(isActive: boolean, variant: SidebarNavProps["variant"], collapsed = false) {
  const base = "relative rounded-lg border text-sm font-semibold transition premium-focus";

  if (variant === "mobile") {
    const state = isActive
      ? "border-brand-100 bg-brand-50 text-brand-800"
      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-ink";
    return `${base} ${state} flex min-h-11 w-full items-center gap-2 px-4 py-2.5`;
  }

  const state = isActive
    ? "border-white/15 bg-white/10 text-white before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-1 before:rounded-full before:bg-campus-teal"
    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.07] hover:text-white";
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
      <div className="border-b border-campus-border bg-white px-3 py-3 shadow-sm lg:hidden" data-mobile-navigation="true">
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
                  <NavigationIcon href={item.href} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
        <details className="rounded-lg border border-campus-border bg-white shadow-sm">
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
                        <NavigationIcon href={item.href} />
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
      className={`sticky top-0 hidden h-screen max-h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-sidebar py-5 shadow-[10px_0_28px_rgba(11,22,56,0.10)] transition-[width,padding] duration-200 ease-out motion-reduce:transition-none lg:flex ${isCollapsed ? "w-[5.25rem] px-3" : "w-72 px-4"}`}
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
        <div className={`flex min-h-16 min-w-0 items-center transition-all duration-200 ${isCollapsed ? "justify-center" : "px-1"}`}>
          {isCollapsed ? (
            <AppMark className="h-11 w-11" priority />
          ) : (
            <BrandLogo variant="inverse" className="w-full max-w-[13rem]" priority />
          )}
        </div>
        <div className={isCollapsed ? "sr-only" : "mt-4 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3"}>
          <p className="text-[11px] font-semibold uppercase text-slate-400">Institution</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{brandName}</p>
        </div>
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={isPinnedOpen ? "Collapse sidebar" : "Pin sidebar open"}
          aria-pressed={isPinnedOpen}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white premium-focus"
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
            <p className={isCollapsed ? "sr-only" : "px-3 text-[11px] font-bold uppercase text-slate-500"}>{group.title}</p>
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
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${isActive ? "bg-white text-brand-700" : "bg-white/[0.07] text-slate-400"}`}>
                      <NavigationIcon href={item.href} />
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
