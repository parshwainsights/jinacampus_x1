import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getUserById } from "@/modules/campus-core/queries";
import { UserEditForm } from "@/modules/campus-core/components/campus-core-profile-forms";
import { PermissionState } from "@/components/ui/empty-state";

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.user.update")) return <PermissionState />;
  const { userId } = await params;
  const user = await getUserById(ctx, userId);
  if (!user) notFound();

  return (
    <UserEditForm
      user={{
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userType: user.userType,
        status: user.status
      }}
    />
  );
}
