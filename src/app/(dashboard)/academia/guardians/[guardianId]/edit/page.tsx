import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getGuardianById } from "@/modules/academia/queries";
import { GuardianEditForm } from "@/modules/academia/components/core-record-edit-forms";

export default async function EditGuardianPage({ params }: { params: Promise<{ guardianId: string }> }) {
  const ctx = await requireAuth();
  const { guardianId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("academia.guardian.manage")) return <PermissionState />;

  const guardian = await getGuardianById(ctx, guardianId);
  if (!guardian) notFound();

  return (
    <GuardianEditForm
      guardian={{
        id: guardian.id,
        firstName: guardian.firstName,
        middleName: guardian.middleName,
        lastName: guardian.lastName,
        displayName: guardian.displayName,
        phone: guardian.phone,
        email: guardian.email,
        occupation: guardian.occupation,
        addressLine1: guardian.addressLine1,
        addressLine2: guardian.addressLine2,
        city: guardian.city,
        state: guardian.state,
        postalCode: guardian.postalCode,
        country: guardian.country
      }}
    />
  );
}
