import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listBranches, listInstitutions } from "@/modules/campus-core/queries";
import { createBranchAction } from "@/modules/campus-core/actions";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge, TableActionLink } from "@/components/ui/table-primitives";
import { MobileListCard } from "@/components/mobile/mobile-list-card";

export default async function BranchesPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx });
  if (!permissions.has("campuscore.branch.manage") || !permissions.has("campuscore.institution.manage")) {
    return <PermissionState />;
  }

  const [branches, institutions] = await Promise.all([listBranches(ctx), listInstitutions(ctx)]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Branches</h1><p className="text-sm text-slate-500">Manage branches and branch-level boundaries.</p></div>
      <form action={createBranchAction} className="premium-card grid gap-3 p-4 sm:p-5 md:grid-cols-5">
        <select name="institutionId" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm">{institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <input name="name" placeholder="Branch name" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <input name="code" placeholder="Code" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <input name="city" placeholder="City" className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <button className="min-h-12 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800">Create</button>
      </form>
      {branches.length ? (
        <>
          <div className="grid gap-3 md:hidden" data-mobile-branch-cards="true">
            {branches.map((b) => (
              <MobileListCard
                key={b.id}
                title={b.name}
                subtitle={b.institution.name}
                status={<StatusBadge value={b.status} />}
                meta={[
                  { label: "Code", value: b.code },
                ]}
                actions={
                  <>
                    <TableActionLink href={`/campus-core/branches/${b.id}`} ariaLabel={`View ${b.name}`}>View</TableActionLink>
                    <TableActionLink href={`/campus-core/branches/${b.id}/edit`} ariaLabel={`Edit ${b.name}`}>Edit</TableActionLink>
                  </>
                }
              />
            ))}
          </div>
          <div className="hidden md:block">
            <ResponsiveTable columns={["Branch", "Code", "Institution", "Status", "Actions"]} caption="Branches table">
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{b.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{b.code}</td>
                  <td className="whitespace-nowrap px-4 py-3">{b.institution.name}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={b.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <TableActionLink href={`/campus-core/branches/${b.id}`} ariaLabel={`View ${b.name}`}>View</TableActionLink>
                      <TableActionLink href={`/campus-core/branches/${b.id}/edit`} ariaLabel={`Edit ${b.name}`}>Edit</TableActionLink>
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </div>
        </>
      ) : (
        <EmptyState title="No branches available" description="Create a branch after adding an institution." />
      )}
    </div>
  );
}
