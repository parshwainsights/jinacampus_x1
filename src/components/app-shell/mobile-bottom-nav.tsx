"use client";

import {
  BarChart3,
  ClipboardCheck,
  Home,
  Menu,
  QrCode,
  School,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { PermissionCode } from "@/lib/rbac/permissions";

import {
  getActiveNavHref,
  getMobileBottomNavigationItems,
  getVisibleNavigationGroups,
  isNavItemActive,
  type MobileBottomNavItem,
} from "./navigation";

type MobileBottomNavProps = {
  permissions: ReadonlySet<PermissionCode>;
};

const navIconByTitle: Record<string, LucideIcon> = {
  Home,
  Attendance: ClipboardCheck,
  Users,
  Reports: BarChart3,
  "My Class": School,
  Students: Users,
  "Scan QR": QrCode,
  "My Attendance": ClipboardCheck,
  Profile: User,
  More: Menu,
};

function iconForItem(item: MobileBottomNavItem) {
  return navIconByTitle[item.title] ?? Menu;
}

export function MobileBottomNav({ permissions }: MobileBottomNavProps) {
  const pathname = usePathname();
  const groups = getVisibleNavigationGroups(permissions);
  const activeHref = getActiveNavHref(groups, pathname);
  const items = getMobileBottomNavigationItems(permissions);
  const gridColumns = `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`;

  if (items.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-18px_36px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden"
      aria-label="Mobile primary navigation"
      data-mobile-navigation="true"
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: gridColumns }}>
        {items.map((item) => {
          const Icon = iconForItem(item);
          const isActive = item.kind === "more" ? false : isNavItemActive(item, pathname, activeHref);

          if (item.kind === "more") {
            return (
              <details key={item.title} className="group relative" id="mobile-more-menu">
                <summary className="flex min-h-14 list-none flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [&::-webkit-details-marker]:hidden">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.title}</span>
                </summary>
                <div className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/18">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    More
                  </p>
                  <div className="max-h-[55vh] overflow-y-auto pr-1">
                    {groups.map((group) => (
                      <div key={group.title} className="mb-3 last:mb-0">
                        <p className="px-2 text-xs font-semibold text-slate-400">{group.title}</p>
                        <div className="mt-1 space-y-1">
                          {group.items.map((groupItem) => (
                            <Link
                              key={groupItem.href}
                              href={groupItem.href}
                              className="flex min-h-11 items-center rounded-2xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              {groupItem.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
