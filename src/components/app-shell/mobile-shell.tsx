import type { PermissionCode } from "@/lib/rbac/permissions";

import type { AppShellBranding } from "./branding";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileContextBar } from "./mobile-context-bar";
import { MobileTopbar } from "./mobile-topbar";
import type { TopbarContext } from "./topbar";

type MobileShellProps = {
  permissions: ReadonlySet<PermissionCode>;
  context: TopbarContext;
  branding: AppShellBranding;
};

export function MobileShell({ permissions, context, branding }: MobileShellProps) {
  return (
    <div className="lg:hidden" data-mobile-shell="true">
      <MobileTopbar context={context} branding={branding} />
      <MobileContextBar context={context} branding={branding} />
      <MobileBottomNav permissions={permissions} />
    </div>
  );
}
