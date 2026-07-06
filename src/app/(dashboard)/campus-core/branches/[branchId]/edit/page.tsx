import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getBranchById, listInstitutions } from "@/modules/campus-core/queries";
import { BranchEditForm } from "@/modules/campus-core/components/campus-core-profile-forms";
import { PermissionState } from "@/components/ui/empty-state";

export default async function EditBranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const ctx = await requireAuth();
  const { branchId } = await params;
  let permissions: Awaited<ReturnType<typeof getEffectivePermissions>>;
  try {
    permissions = await getEffectivePermissions({ ctx, branchId });
  } catch {
    return <PermissionState />;
  }
  if (!permissions.has("campuscore.branch.manage") || !permissions.has("campuscore.institution.manage")) {
    return <PermissionState />;
  }

  const [branch, institutions] = await Promise.all([getBranchById(ctx, branchId), listInstitutions(ctx)]);
  if (!branch) notFound();

  return (
    <BranchEditForm
      institutions={institutions.map((institution) => ({ id: institution.id, name: institution.name, code: institution.code }))}
      branch={{
        id: branch.id,
        institutionId: branch.institutionId,
        name: branch.name,
        code: branch.code,
        status: branch.status,
        addressLine1: branch.addressLine1,
        addressLine2: branch.addressLine2,
        city: branch.city,
        state: branch.state,
        postalCode: branch.postalCode,
        phone: branch.phone,
        email: branch.email,
        timezone: branch.timezone
      }}
    />
  );
}
