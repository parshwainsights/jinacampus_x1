import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listAccessibleBranches } from "@/modules/campus-core/queries";
import { getStaffProfileById } from "@/modules/staffboard-lite/queries";
import { StaffProfileEditForm } from "@/modules/staffboard-lite/components/staff-profile-edit-form";

function dateInputValue(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditStaffProfilePage({ params }: { params: Promise<{ staffId: string }> }) {
  const ctx = await requireAuth();
  const { staffId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("staffboard.staff.update")) return <PermissionState />;

  const [staffProfile, branches] = await Promise.all([getStaffProfileById(ctx, staffId), listAccessibleBranches(ctx)]);
  if (!staffProfile) notFound();

  return (
    <StaffProfileEditForm
      branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))}
      canDeactivate={permissions.has("staffboard.staff.deactivate")}
      staffProfile={{
        id: staffProfile.id,
        branchId: staffProfile.branchId,
        employeeCode: staffProfile.employeeCode,
        firstName: staffProfile.firstName,
        middleName: staffProfile.middleName,
        lastName: staffProfile.lastName,
        staffType: staffProfile.staffType,
        designation: staffProfile.designation,
        department: staffProfile.department,
        phone: staffProfile.phone,
        email: staffProfile.email,
        joiningDate: dateInputValue(staffProfile.joiningDate),
        employmentStatus: staffProfile.employmentStatus,
        user: staffProfile.user
          ? {
            id: staffProfile.user.id,
            email: staffProfile.user.email,
            status: staffProfile.user.status,
            passwordCredential: staffProfile.user.passwordCredential,
            roleAssignments: staffProfile.user.roleAssignments
          }
          : null
      }}
    />
  );
}
