import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listInstitutions } from "@/modules/campus-core/queries";
import { createInstitutionAction } from "@/modules/campus-core/actions";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge, TableActionLink } from "@/components/ui/table-primitives";

export default async function InstitutionsPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx });
  if (!permissions.has("campuscore.institution.manage")) return <PermissionState />;

  const institutions = await listInstitutions(ctx);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Institutions</h1><p className="text-sm text-slate-500">Manage tenant institutions.</p></div>
      <form action={createInstitutionAction} className="premium-card grid gap-3 p-5 md:grid-cols-4">
        <input name="name" placeholder="Institution name" required />
        <input name="displayName" placeholder="Display name (optional)" />
        <input name="code" placeholder="Code e.g. MAIN" required />
        <input name="board" placeholder="Board" />
        <button className="bg-brand-700 px-4 py-2 text-sm font-medium text-white">Create</button>
      </form>
      {institutions.length ? (
        <ResponsiveTable columns={["Institution", "Code", "Status", "Actions"]} caption="Institutions table">
          {institutions.map((i) => (
            <tr key={i.id}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-3">
                  {i.logoUrl ? (
                    <img src={i.logoUrl} alt={`${i.displayName ?? i.name} logo`} className="h-8 w-8 rounded-lg border border-slate-200 object-cover" />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                      {(i.displayName ?? i.name).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>{i.displayName ?? i.name}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{i.code}</td>
              <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={i.status} /></td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex gap-2">
                  <TableActionLink href={`/campus-core/institutions/${i.id}`} ariaLabel={`View ${i.name}`}>View</TableActionLink>
                  <TableActionLink href={`/campus-core/institutions/${i.id}/edit`} ariaLabel={`Edit ${i.name}`}>Edit</TableActionLink>
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      ) : (
        <EmptyState title="No institutions yet" description="Create the first institution for this tenant." />
      )}
    </div>
  );
}
