import { DesktopShell } from "@/components/app-shell/desktop-shell";
import { MobileShell } from "@/components/app-shell/mobile-shell";
import { Topbar } from "@/components/app-shell/topbar";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  const topbarContext = {
    userEmail: ctx.userEmail,
    hasActiveBranch: Boolean(ctx.activeBranchId),
    hasActiveAcademicYear: Boolean(ctx.activeAcademicYearId)
  };
  const branding = {
    institutionName: ctx.institutionDisplayName ?? ctx.institutionName ?? ctx.tenantName ?? "JinaCampus",
    logoUrl: ctx.institutionLogoUrl ?? null,
    branchName: ctx.activeBranchName ?? null,
    branchCode: ctx.activeBranchCode ?? null,
    academicYearName: ctx.activeAcademicYearName ?? null,
    roleLabels: ctx.roleLabels ?? []
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.10),transparent_32rem),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <DesktopShell permissions={permissions} branding={branding} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden lg:block">
          <Topbar context={topbarContext} branding={branding} />
        </div>
        <MobileShell permissions={permissions} context={topbarContext} branding={branding} />
        <main className="flex-1 px-3 pb-28 pt-4 sm:px-4 md:px-5 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
