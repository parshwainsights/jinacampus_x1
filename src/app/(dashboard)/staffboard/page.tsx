import { forbidden } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { STAFFBOARD_LITE_PERMISSIONS } from "@/modules/staffboard-lite/permissions";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { StaffboardOverviewCards } from "@/modules/staffboard-lite/components/staffboard-overview-cards";

export default async function StaffboardOverviewPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!STAFFBOARD_LITE_PERMISSIONS.some((permission) => permissions.has(permission))) {
    throw forbidden("FORBIDDEN_STAFFBOARD_ACCESS");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="StaffBoard Lite"
        description="Manage staff profiles and prepare the branch-safe QR attendance workflow for teaching and non-teaching staff."
      />

      <StaffboardOverviewCards permissions={permissions} />
    </div>
  );
}
