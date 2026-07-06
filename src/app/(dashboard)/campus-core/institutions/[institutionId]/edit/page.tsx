import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getInstitutionById } from "@/modules/campus-core/queries";
import { InstitutionEditForm } from "@/modules/campus-core/components/campus-core-profile-forms";
import { PermissionState } from "@/components/ui/empty-state";

export default async function EditInstitutionPage({ params }: { params: Promise<{ institutionId: string }> }) {
  const ctx = await requireAuth();
  const { institutionId } = await params;
  const permissions = await getEffectivePermissions({ ctx });
  if (!permissions.has("campuscore.institution.manage")) return <PermissionState />;

  const institution = await getInstitutionById(ctx, institutionId);
  if (!institution) notFound();

  return (
    <InstitutionEditForm
      institution={{
        id: institution.id,
        name: institution.name,
        displayName: institution.displayName,
        code: institution.code,
        status: institution.status,
        board: institution.board,
        medium: institution.medium,
        logoUrl: institution.logoUrl,
        addressLine1: institution.addressLine1,
        addressLine2: institution.addressLine2,
        city: institution.city,
        state: institution.state,
        postalCode: institution.postalCode,
        country: institution.country
      }}
    />
  );
}
