import type { PermissionCode } from "@/lib/rbac/permissions";
import type { AppShellBranding } from "./branding";
import { getPrimaryMobileNavigationItems, getVisibleNavigationGroups } from "./navigation";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar({ permissions, branding }: { permissions: ReadonlySet<PermissionCode>; branding: AppShellBranding }) {
  return <SidebarNav groups={getVisibleNavigationGroups(permissions)} variant="desktop" branding={branding} />;
}

export function MobileNavigation({ permissions, branding }: { permissions: ReadonlySet<PermissionCode>; branding: AppShellBranding }) {
  return (
    <SidebarNav
      groups={getVisibleNavigationGroups(permissions)}
      primaryItems={getPrimaryMobileNavigationItems(permissions)}
      variant="mobile"
      branding={branding}
    />
  );
}
