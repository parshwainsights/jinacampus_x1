import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listAccessibleBranches, listAssignableRoles, listUsers } from "@/modules/campus-core/queries";
import { UserCreateForm } from "@/modules/campus-core/components/campus-core-profile-forms";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge, TableActionLink } from "@/components/ui/table-primitives";
import { MobileListCard } from "@/components/mobile/mobile-list-card";

export default async function UsersPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.user.view")) return <PermissionState />;
  const users = await listUsers(ctx);
  const canCreateUsers = permissions.has("campuscore.user.create");
  const canUpdateUsers = permissions.has("campuscore.user.update");
  const canResetPasswords = permissions.has("campuscore.user.reset_password");
  const canAssignRoles = permissions.has("campuscore.user.manage");
  const [branches, roles] = canCreateUsers
    ? await Promise.all([listAccessibleBranches(ctx), canAssignRoles ? listAssignableRoles(ctx) : Promise.resolve([])])
    : [[], []];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Users</h1><p className="text-sm text-slate-500">Manage accounts, roles, and branch access.</p></div>
      {canCreateUsers ? (
        <UserCreateForm branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))} roles={roles.map((role) => ({ id: role.id, code: role.code, name: role.name }))} />
      ) : null}
      {users.length ? (
        <>
          <div className="grid gap-3 md:hidden" data-mobile-user-cards="true">
            {users.map((u) => (
              <MobileListCard
                key={u.id}
                title={u.displayName ?? u.firstName}
                subtitle={u.email}
                status={<StatusBadge value={u.status} />}
                meta={[
                  {
                    label: "Roles",
                    value: u.roleAssignments.map((a) => a.role.code).join(", ") || "No roles",
                  },
                ]}
                actions={
                  <>
                    <TableActionLink href={`/campus-core/users/${u.id}`} ariaLabel={`View ${u.email}`}>View</TableActionLink>
                    {canUpdateUsers ? (
                      <TableActionLink href={`/campus-core/users/${u.id}/edit`} ariaLabel={`Edit ${u.email}`}>Edit</TableActionLink>
                    ) : null}
                    {canResetPasswords ? (
                      <TableActionLink href={`/campus-core/users/${u.id}/reset-password`} ariaLabel={`Reset password for ${u.email}`}>Reset Password</TableActionLink>
                    ) : null}
                  </>
                }
              />
            ))}
          </div>
          <div className="hidden md:block">
            <ResponsiveTable columns={["User", "Email", "Status", "Roles", "Actions"]} caption="Users table">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{u.displayName ?? u.firstName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={u.status} /></td>
                  <td className="px-4 py-3">{u.roleAssignments.map((a) => a.role.code).join(", ")}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <TableActionLink href={`/campus-core/users/${u.id}`} ariaLabel={`View ${u.email}`}>View</TableActionLink>
                      {canUpdateUsers ? (
                        <TableActionLink href={`/campus-core/users/${u.id}/edit`} ariaLabel={`Edit ${u.email}`}>Edit</TableActionLink>
                      ) : null}
                      {canResetPasswords ? (
                        <TableActionLink href={`/campus-core/users/${u.id}/reset-password`} ariaLabel={`Reset password for ${u.email}`}>Reset Password</TableActionLink>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </div>
        </>
      ) : (
        <EmptyState title="No users found" description="Create an invited user with branch and role access." />
      )}
    </div>
  );
}
