"use client";

import { useState } from "react";

import type { AppShellBranding } from "./branding";
import { AppNavbar } from "./app-navbar";
import { DesktopNavigationDock } from "./desktop-navigation-dock";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { NavbarSessionContext } from "./navbar-types";
import type { MobileBottomNavItem, NavGroup } from "./navigation";

type AppChromeProps = {
  context: NavbarSessionContext;
  branding: AppShellBranding;
  navigationGroups: readonly NavGroup[];
  mobileBottomItems: readonly MobileBottomNavItem[];
};

export function AppChrome({ context, branding, navigationGroups, mobileBottomItems }: AppChromeProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <>
      <AppNavbar
        context={context}
        branding={branding}
        navigationGroups={navigationGroups}
        mobileNavigationOpen={mobileNavigationOpen}
        onMobileNavigationOpenChange={setMobileNavigationOpen}
      />
      <DesktopNavigationDock groups={navigationGroups} />
      <MobileBottomNav
        groups={navigationGroups}
        items={mobileBottomItems}
        onOpenNavigation={() => setMobileNavigationOpen(true)}
      />
    </>
  );
}
