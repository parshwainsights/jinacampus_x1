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

import {
  getActiveNavHref,
  isNavItemActive,
  type MobileBottomNavItem,
  type NavGroup,
} from "./navigation";

type MobileBottomNavProps = {
  groups: readonly NavGroup[];
  items: readonly MobileBottomNavItem[];
  onOpenNavigation: () => void;
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

export function MobileBottomNav({ groups, items, onOpenNavigation }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeHref = getActiveNavHref(groups, pathname);
  const gridColumns = `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`;

  if (items.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-campus-border bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-10px_28px_rgba(11,22,56,0.10)] lg:hidden"
      aria-label="Mobile primary navigation"
      data-mobile-navigation="true"
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: gridColumns }}>
        {items.map((item) => {
          const Icon = iconForItem(item);
          const isActive = item.kind === "more" ? false : isNavItemActive(item, pathname, activeHref);

          if (item.kind === "more") {
            return (
              <button
                key={item.title}
                type="button"
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 premium-focus"
                aria-label="Open all application navigation"
                onClick={onOpenNavigation}
              >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.title}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full text-center text-[10px] leading-3 whitespace-normal">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
