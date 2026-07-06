import { forbidden } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { StaffCategoryCard } from "@/modules/staffboard-lite/components/staff-category-card";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { staffCategoryCards } from "@/modules/staffboard-lite/ui-config";

export default async function StaffCategoriesPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("staffboard.staff.view")) {
    throw forbidden("FORBIDDEN_STAFF_CATEGORIES_ACCESS");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Categories"
        description="Review the StaffBoard Lite categories used for staff profile setup and future attendance filtering."
      />

      <section aria-label="Staff categories" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staffCategoryCards.map((category) => (
          <StaffCategoryCard key={category.value} category={category} />
        ))}
      </section>
    </div>
  );
}
