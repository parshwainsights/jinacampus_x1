import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getUserById, listAssignableRoles, listUserAssignableBranches } from "@/modules/campus-core/queries";
import { StatusBadge } from "@/components/ui/table-primitives";
import { UserBranchAccessCard, UserLifecycleActionCard, UserRoleAssignmentsCard } from "@/modules/campus-core/components/campus-core-profile-forms";
import { PermissionState } from "@/components/ui/empty-state";

function value(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  if (value instanceof Date) return value.toLocaleDateString("en-IN");
  return value;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireAuth();
  const { userId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.user.view")) return <PermissionState />;
  const user = await getUserById(ctx, userId);
  if (!user) notFound();
  const canUpdateUsers = permissions.has("campuscore.user.update");
  const canResetPasswords = permissions.has("campuscore.user.reset_password");
  const canManageRoles = permissions.has("campuscore.user.manage");
  const canDeactivateUsers = permissions.has("campuscore.user.deactivate");
  const [availableRoles, availableBranches] = await Promise.all([
    canManageRoles ? listAssignableRoles(ctx) : Promise.resolve([]),
    canUpdateUsers ? listUserAssignableBranches(ctx) : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">User Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{user.displayName ?? user.firstName}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/campus-core/users" className="premium-secondary-button">
            Back to Users
          </Link>
          {canUpdateUsers ? (
            <Link href={`/campus-core/users/${user.id}/edit`} className="premium-secondary-button">
              Edit
            </Link>
          ) : null}
          {canResetPasswords ? (
            <Link href={`/campus-core/users/${user.id}/reset-password`} className="premium-primary-button">
              Reset Password
            </Link>
          ) : null}
        </div>
      </div>

      <section className="premium-card p-5">
        <dl className="grid gap-5 md:grid-cols-3">
          <DetailItem label="Name">{user.displayName ?? user.firstName}</DetailItem>
          <DetailItem label="Email">{user.email}</DetailItem>
          <DetailItem label="Status"><StatusBadge value={user.status} /></DetailItem>
          <DetailItem label="Tenant">{user.tenant.name}</DetailItem>
          <DetailItem label="Phone">{value(user.phone)}</DetailItem>
          <DetailItem label="User Type">{user.userType.replace(/_/g, " ")}</DetailItem>
          <DetailItem label="Password Status">{user.passwordCredential ? "Password set" : "Password not set"}</DetailItem>
          <DetailItem label="Must Change Password">{user.passwordCredential?.mustChange ? "Yes" : "No"}</DetailItem>
          <DetailItem label="Last Login">{value(user.lastLoginAt)}</DetailItem>
          <DetailItem label="Password Updated">{value(user.passwordCredential?.passwordUpdatedAt)}</DetailItem>
          <DetailItem label="Branches">{user.branchAccesses.map((access) => access.branch.name).join(", ") || "Not set"}</DetailItem>
          <DetailItem label="Roles">{user.roleAssignments.map((assignment) => assignment.role.name).join(", ") || "Not set"}</DetailItem>
          <DetailItem label="Created">{value(user.createdAt)}</DetailItem>
          <DetailItem label="Updated">{value(user.updatedAt)}</DetailItem>
        </dl>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <UserRoleAssignmentsCard
          userId={user.id}
          assignedRoles={user.roleAssignments}
          availableRoles={availableRoles.map((role) => ({ id: role.id, code: role.code, name: role.name }))}
          canManageRoles={canManageRoles}
        />
        <UserBranchAccessCard
          userId={user.id}
          assignedBranches={user.branchAccesses}
          availableBranches={availableBranches.map((branch) => ({ id: branch.id, name: branch.name, code: branch.code }))}
          canManageBranches={canUpdateUsers}
        />
      </div>
      <section className="premium-card p-5">
        <h2 className="text-lg font-semibold text-slate-950">Account Actions</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Use these actions to update the user profile or reset account access safely.</p>
        {canUpdateUsers || canResetPasswords ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {canUpdateUsers ? (
              <Link href={`/campus-core/users/${user.id}/edit`} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 sm:w-auto">
                Edit User Profile
              </Link>
            ) : null}
            {canResetPasswords ? (
              <Link href={`/campus-core/users/${user.id}/reset-password`} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white sm:w-auto">
                Reset Password
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">You do not have permission to manage this user account.</p>
        )}
      </section>
      <UserLifecycleActionCard
        user={{ id: user.id, email: user.email, status: user.status }}
        canDeactivate={canDeactivateUsers}
        isCurrentUser={user.id === ctx.userId}
      />
    </div>
  );
}
