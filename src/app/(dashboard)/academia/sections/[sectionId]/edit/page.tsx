import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getSectionById } from "@/modules/academia/queries";
import { SectionEditForm } from "@/modules/academia/components/core-record-edit-forms";

export default async function EditSectionPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const ctx = await requireAuth();
  const { sectionId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("academia.section.manage")) return <PermissionState />;

  const section = await getSectionById(ctx, sectionId);
  if (!section) notFound();

  return (
    <SectionEditForm
      record={{
        id: section.id,
        code: section.code,
        name: section.name,
        description: section.description,
        sortOrder: section.sortOrder,
        status: section.status
      }}
    />
  );
}
