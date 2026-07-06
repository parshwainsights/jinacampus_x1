import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listPermissions, listRoles } from "@/modules/campus-core/queries";
import { createRoleAction } from "@/modules/campus-core/actions";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, formatEnumLabel } from "@/components/ui/table-primitives";

export default async function RolesPage() {
  const ctx = await requireAuth();
  const effectivePermissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!effectivePermissions.has("campuscore.role.view")) return <PermissionState />;
  const canCreateRoles = effectivePermissions.has("campuscore.role.manage");
  const [roles, permissions] = await Promise.all([
    listRoles(ctx),
    canCreateRoles ? listPermissions(ctx) : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Roles & Permissions</h1><p className="text-sm text-slate-500">Permission-based tenant-scoped RBAC.</p></div>
      {canCreateRoles ? (
        <form action={createRoleAction} className="premium-card grid gap-3 p-5 md:grid-cols-5">
          <input name="code" placeholder="ROLE_CODE" required />
          <input name="name" placeholder="Role name" required />
          <select name="scope"><option value="TENANT">Tenant</option><option value="BRANCH">Branch</option></select>
          <select name="permissionCodes" multiple>{permissions.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}</select>
          <button className="bg-brand-700 px-4 py-2 text-sm font-medium text-white">Create</button>
        </form>
      ) : null}
      {roles.length ? (
        <ResponsiveTable columns={["Role Code", "Name", "Scope", "Permissions"]} caption="Roles table">
          {roles.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{r.code}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.name}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatEnumLabel(r.scope)}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.rolePermissions.length}</td>
            </tr>
          ))}
        </ResponsiveTable>
      ) : (
        <EmptyState title="No roles found" description="Seed or create a tenant-scoped role." />
      )}
    </div>
  );
}
