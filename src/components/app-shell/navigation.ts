import { ACADEMIA_PERMISSIONS } from "@/modules/academia/permissions";
import { STAFFBOARD_LITE_PERMISSIONS } from "@/modules/staffboard-lite/permissions";
import type { PermissionCode } from "@/lib/rbac/permissions";

export type NavigationAudience = "admin" | "teacher" | "staff";

export type NavItem = {
  title: string;
  href: string;
  permissions: readonly PermissionCode[];
};

export type NavGroup = {
  title: string;
  items: readonly NavItem[];
};

export const NAVIGATION_GROUPS = [
  {
    title: "Dashboard",
    items: [{ title: "Dashboard", href: "/dashboard", permissions: ["campuscore.tenant.view"] }]
  },
  {
    title: "CampusCore",
    items: [
      { title: "Institutions", href: "/campus-core/institutions", permissions: ["campuscore.institution.manage"] },
      { title: "Branches", href: "/campus-core/branches", permissions: ["campuscore.branch.manage"] },
      { title: "Academic Years", href: "/campus-core/academic-years", permissions: ["campuscore.academic_year.manage"] },
      { title: "Users", href: "/campus-core/users", permissions: ["campuscore.user.view"] },
      { title: "Roles", href: "/campus-core/roles", permissions: ["campuscore.role.view"] },
      { title: "Settings", href: "/campus-core/settings", permissions: ["campuscore.settings.manage"] },
      { title: "Audit Logs", href: "/campus-core/audit-logs", permissions: ["campuscore.audit.view"] }
    ]
  },
  {
    title: "Academia",
    items: [
      { title: "Overview", href: "/academia", permissions: ACADEMIA_PERMISSIONS },
      { title: "Students", href: "/academia/students", permissions: ["academia.student.view"] },
      { title: "Guardians", href: "/academia/guardians", permissions: ["academia.guardian.manage"] },
      { title: "Enrollments", href: "/academia/enrollments", permissions: ["academia.enrollment.manage"] },
      { title: "Classes", href: "/academia/classes", permissions: ["academia.class.manage"] },
      { title: "Sections", href: "/academia/sections", permissions: ["academia.section.manage"] },
      { title: "Class Sections", href: "/academia/class-sections", permissions: ["academia.class.manage"] },
      { title: "Subjects", href: "/academia/subjects", permissions: ["academia.subject.manage"] },
      { title: "Student Attendance", href: "/academia/attendance", permissions: ["academia.attendance.view"] },
      { title: "Student Attendance Reports", href: "/academia/attendance/reports", permissions: ["academia.attendance.report"] }
    ]
  },
  {
    title: "StaffBoard Lite",
    items: [
      { title: "Overview", href: "/staffboard", permissions: STAFFBOARD_LITE_PERMISSIONS },
      { title: "Staff Profiles", href: "/staffboard/staff", permissions: ["staffboard.staff.view"] },
      { title: "Categories", href: "/staffboard/categories", permissions: ["staffboard.staff.view"] },
      { title: "Staff Attendance", href: "/staffboard/attendance", permissions: ["staffboard.attendance.view"] },
      { title: "QR Display", href: "/staffboard/attendance/qr", permissions: ["staffboard.attendance.qr.generate"] },
      { title: "Scan QR", href: "/staffboard/attendance/scan", permissions: ["staffboard.attendance.self_scan"] },
      { title: "Staff Reports", href: "/staffboard/attendance/reports", permissions: ["staffboard.attendance.report"] }
    ]
  }
] satisfies readonly NavGroup[];

export type MobileNavShortcut = {
  title: string;
  href: string;
  permissions: readonly PermissionCode[];
  audiences: readonly NavigationAudience[];
};

export type MobileBottomNavItem = {
  title: string;
  href: string;
  permissions: readonly PermissionCode[];
  audiences: readonly NavigationAudience[];
  kind?: "link" | "more";
};

const ADMIN_NAV_SIGNALS = [
  "campuscore.user.view",
  "campuscore.role.view",
  "campuscore.settings.manage",
  "academia.enrollment.manage",
  "staffboard.staff.view",
  "staffboard.attendance.qr.generate",
  "staffboard.attendance.report"
] as const satisfies readonly PermissionCode[];

const TEACHER_NAV_SIGNALS = [
  "academia.attendance.mark",
  "academia.attendance.report"
] as const satisfies readonly PermissionCode[];

export const MOBILE_NAVIGATION_SHORTCUTS = [
  {
    title: "Home",
    href: "/dashboard",
    permissions: ["campuscore.tenant.view"],
    audiences: ["admin", "teacher", "staff"]
  },
  {
    title: "Students",
    href: "/academia/students",
    permissions: ["academia.student.view"],
    audiences: ["admin"]
  },
  {
    title: "Staff",
    href: "/staffboard/staff",
    permissions: ["staffboard.staff.view"],
    audiences: ["admin"]
  },
  {
    title: "Attendance",
    href: "/academia/attendance/mark",
    permissions: ["academia.attendance.view", "academia.attendance.mark"],
    audiences: ["teacher"]
  },
  {
    title: "Scan QR",
    href: "/staffboard/attendance/scan",
    permissions: ["staffboard.attendance.self_scan"],
    audiences: ["teacher", "staff"]
  },
  {
    title: "Reports",
    href: "/academia/attendance/reports",
    permissions: ["academia.attendance.report"],
    audiences: ["admin", "teacher"]
  },
  {
    title: "Staff Reports",
    href: "/staffboard/attendance/reports",
    permissions: ["staffboard.attendance.report"],
    audiences: ["admin"]
  }
] as const satisfies readonly MobileNavShortcut[];

const MOBILE_BOTTOM_NAVIGATION_ITEMS = {
  admin: [
    {
      title: "Home",
      href: "/dashboard",
      permissions: ["campuscore.tenant.view"],
      audiences: ["admin"]
    },
    {
      title: "Attendance",
      href: "/academia/attendance",
      permissions: ["academia.attendance.view"],
      audiences: ["admin"]
    },
    {
      title: "Users",
      href: "/campus-core/users",
      permissions: ["campuscore.user.view"],
      audiences: ["admin"]
    },
    {
      title: "Reports",
      href: "/staffboard/attendance/reports",
      permissions: ["staffboard.attendance.report"],
      audiences: ["admin"]
    }
  ],
  teacher: [
    {
      title: "Home",
      href: "/dashboard",
      permissions: ["campuscore.tenant.view"],
      audiences: ["teacher"]
    },
    {
      title: "My Class",
      href: "/academia/attendance/mark",
      permissions: ["academia.attendance.view", "academia.attendance.mark"],
      audiences: ["teacher"]
    },
    {
      title: "Attendance",
      href: "/academia/attendance/reports",
      permissions: ["academia.attendance.report"],
      audiences: ["teacher"]
    },
    {
      title: "Students",
      href: "/academia/students",
      permissions: ["academia.student.view"],
      audiences: ["teacher"]
    }
  ],
  staff: [
    {
      title: "Home",
      href: "/dashboard",
      permissions: ["campuscore.tenant.view"],
      audiences: ["staff"]
    },
    {
      title: "Scan QR",
      href: "/staffboard/attendance/scan",
      permissions: ["staffboard.attendance.self_scan"],
      audiences: ["staff"]
    },
    {
      title: "My Attendance",
      href: "/staffboard/attendance",
      permissions: ["staffboard.attendance.view"],
      audiences: ["staff"]
    },
    {
      title: "Profile",
      href: "/account/change-password",
      permissions: [],
      audiences: ["staff"]
    }
  ]
} as const satisfies Record<NavigationAudience, readonly MobileBottomNavItem[]>;

const ACTIVE_ROUTE_OVERRIDES = [
  { pattern: /^\/academia\/attendance\/mark(?:\/|$)/, href: "/academia/attendance" },
  { pattern: /^\/academia\/classes\/[^/]+\/edit(?:\/|$)/, href: "/academia/classes" },
  { pattern: /^\/academia\/sections\/[^/]+\/edit(?:\/|$)/, href: "/academia/sections" },
  { pattern: /^\/academia\/subjects\/[^/]+\/edit(?:\/|$)/, href: "/academia/subjects" },
  { pattern: /^\/academia\/students\/[^/]+\/edit(?:\/|$)/, href: "/academia/students" },
  { pattern: /^\/academia\/guardians\/[^/]+\/edit(?:\/|$)/, href: "/academia/guardians" },
  { pattern: /^\/academia\/enrollments\/[^/]+\/edit(?:\/|$)/, href: "/academia/enrollments" },
  { pattern: /^\/staffboard\/staff\/[^/]+\/edit(?:\/|$)/, href: "/staffboard/staff" }
] as const;

export function canViewNavItem(permissions: ReadonlySet<PermissionCode>, item: NavItem) {
  return item.permissions.some((permission) => permissions.has(permission));
}

function hasEveryPermission(permissions: ReadonlySet<PermissionCode>, requiredPermissions: readonly PermissionCode[]) {
  return requiredPermissions.every((permission) => permissions.has(permission));
}

export function getVisibleNavigationGroups(permissions: ReadonlySet<PermissionCode>) {
  return NAVIGATION_GROUPS
    .map((group) => ({
      title: group.title,
      items: group.items.filter((item) => canViewNavItem(permissions, item))
    }))
    .filter((group) => group.items.length > 0);
}

export function getNavigationAudience(permissions: ReadonlySet<PermissionCode>): NavigationAudience {
  if (ADMIN_NAV_SIGNALS.some((permission) => permissions.has(permission))) return "admin";
  if (TEACHER_NAV_SIGNALS.some((permission) => permissions.has(permission))) return "teacher";
  return "staff";
}

export function getPrimaryMobileNavigationItems(permissions: ReadonlySet<PermissionCode>) {
  const audience = getNavigationAudience(permissions);
  const visibleShortcuts = MOBILE_NAVIGATION_SHORTCUTS.filter(
    (shortcut) =>
      shortcut.audiences.some((shortcutAudience) => shortcutAudience === audience) &&
      hasEveryPermission(permissions, shortcut.permissions)
  );
  const uniqueShortcuts = new Map<string, MobileNavShortcut>();

  for (const shortcut of visibleShortcuts) {
    if (!uniqueShortcuts.has(shortcut.href)) uniqueShortcuts.set(shortcut.href, shortcut);
  }

  return Array.from(uniqueShortcuts.values()).slice(0, 4);
}

export function getMobileBottomNavigationItems(permissions: ReadonlySet<PermissionCode>) {
  const audience = getNavigationAudience(permissions);
  const visibleGroups = getVisibleNavigationGroups(permissions);
  const visibleItems = MOBILE_BOTTOM_NAVIGATION_ITEMS[audience].filter(
    (item) =>
      item.audiences.some((itemAudience) => itemAudience === audience) &&
      hasEveryPermission(permissions, item.permissions)
  );
  const uniqueItems = new Map<string, MobileBottomNavItem>();

  for (const item of visibleItems) {
    if (!uniqueItems.has(item.href)) uniqueItems.set(item.href, item);
  }

  const primaryItems = Array.from(uniqueItems.values()).slice(0, 4);
  if (visibleGroups.length === 0) return primaryItems;

  return [
    ...primaryItems,
    {
      title: "More",
      href: "#mobile-more-menu",
      permissions: [],
      audiences: ["admin", "teacher", "staff"],
      kind: "more"
    }
  ] satisfies MobileBottomNavItem[];
}

export function getActiveNavHref(groups: readonly NavGroup[], pathname: string) {
  const normalizedPathname = pathname.split("?")[0] || "/";
  const items = groups.flatMap((group) => group.items);
  const override = ACTIVE_ROUTE_OVERRIDES.find((route) => route.pattern.test(normalizedPathname));
  if (override && items.some((item) => item.href === override.href)) return override.href;

  const matchingItems = items.filter(
    (item) => normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`)
  );
  return [...matchingItems].sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

export function isNavItemActive(item: Pick<NavItem, "href">, pathname: string, activeHref: string | null) {
  const normalizedPathname = pathname.split("?")[0] || "/";
  if (normalizedPathname === item.href || item.href === activeHref) return true;
  if (activeHref && activeHref !== item.href && activeHref.startsWith(`${item.href}/`)) return false;

  return normalizedPathname.startsWith(`${item.href}/`);
}
