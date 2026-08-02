import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listInstitutions } from "@/modules/campus-core/queries";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge, TableActionLink } from "@/components/ui/table-primitives";

export default async function InstitutionsPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx });
  if (!permissions.has("campuscore.institution.manage")) return <PermissionState />;

  const institutions = await listInstitutions(ctx);

  return (
    <div className="space-y-6">
      <div className="premium-glass-panel p-5">
        <h1 className="text-2xl font-semibold text-slate-950">School Profile</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Review and update the institution profiles available through your assigned branches. New schools are provisioned only from the JinaCampus Administrator Portal.
        </p>
      </div>
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
        <EmptyState
          title="No school profile available"
          description="Ask a JinaCampus administrator to provision the school and assign your branch access."
        />
      )}
    </div>
  );
}
