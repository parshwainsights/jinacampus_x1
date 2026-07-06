import Link from "next/link";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge, TableActionLink } from "@/components/ui/table-primitives";
import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";
import { listSchoolsForAdministrator } from "@/modules/campus-core/administrator-services";
import { AdministratorShell } from "@/modules/campus-core/components/administrator-shell";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value);
}

export default async function AdministratorSchoolsPage({ searchParams }: { searchParams?: SearchParams }) {
  const ctx = await requireAdministratorContext();
  const params = searchParams ? await searchParams : {};
  const search = single(params.search);
  const status = single(params.status);

  try {
    const schools = await listSchoolsForAdministrator(ctx, {
      search,
      status: status === "ACTIVE" || status === "SUSPENDED" || status === "ARCHIVED" || status === "ALL" ? status : "ALL"
    });

    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools">
        <section className="premium-section-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="premium-muted-chip">Schools</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">School Registry</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Search and manage schools. The public login code is labeled School ID; internally it remains the existing unique school identifier.
              </p>
            </div>
            <Link href="/administrator/schools/create" className="premium-primary-button w-full premium-focus sm:w-auto">
              Create School
            </Link>
          </div>
        </section>
        <form className="premium-filter-bar grid gap-3 md:grid-cols-[1fr_180px_auto]" action="/administrator/schools">
          <label className="text-sm font-semibold text-slate-700">
            Search
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="School name, School ID, or support email"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm premium-focus"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select name="status" defaultValue={status ?? "ALL"} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm premium-focus">
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="premium-secondary-button w-full premium-focus">Apply</button>
          </div>
        </form>
        {schools.length ? (
          <ResponsiveTable columns={["School", "School ID", "Status", "Setup", "Updated", "Actions"]} caption="Administrator school registry">
            {schools.map((school) => (
              <tr key={school.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-semibold text-slate-950">{school.name}</p>
                  <p className="text-xs text-slate-500">{school.supportEmail ?? "No support email"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-700">{school.slug}</td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={school.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                  {school._count.institutions} institutions · {school._count.branches} branches · {school._count.users} users
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatDate(school.updatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <TableActionLink
                      href={`/administrator/schools/${school.id}/dashboard`}
                      ariaLabel={`Open Administrator View dashboard for ${school.name}`}
                    >
                      Open School Dashboard
                    </TableActionLink>
                    <TableActionLink href={`/administrator/schools/${school.id}`}>View</TableActionLink>
                    <TableActionLink href={`/administrator/schools/${school.id}/edit`}>Edit</TableActionLink>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        ) : (
          <EmptyState
            title="No schools found"
            description="Create a school tenant or adjust the filters."
            actionLabel="Create School"
            actionHref="/administrator/schools/create"
          />
        )}
      </AdministratorShell>
    );
  } catch {
    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools">
        <PermissionState
          title="School registry unavailable"
          description="Your administrator account does not have permission to view schools."
        />
      </AdministratorShell>
    );
  }
}
