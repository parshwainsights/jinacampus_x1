import type { PermissionCode } from "@/lib/rbac/permissions";

import { Sidebar } from "./sidebar";
import type { AppShellBranding } from "./branding";

type DesktopShellProps = {
  permissions: ReadonlySet<PermissionCode>;
  branding: AppShellBranding;
};

export function DesktopShell({ permissions, branding }: DesktopShellProps) {
  return <Sidebar permissions={permissions} branding={branding} />;
}
