import { FormField } from "@/components/ui/form-primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAuth } from "@/lib/auth/require-auth";
import { listClasses } from "@/modules/academia/queries";
import { createClassAction } from "@/modules/academia/actions/profile.actions";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  formatDateTime,
  PageHeader,
  resolveSearchParam,
  SearchToolbar,
  StatusPill,
  TableActionLink,
  TableShell,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClassesPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const classes = await listClasses(ctx, { search });

  const config = academiaListPageConfigs.classes;

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} />
      <form action={createClassAction} className="premium-card grid gap-3 p-4 md:grid-cols-5">
        <FormField id="create-class-code" label="Code" required helpText="Short code used in lists and reports.">
          <input id="create-class-code" name="code" placeholder="CLASS_1" required className="min-h-11 w-full" />
        </FormField>
        <FormField id="create-class-name" label="Name" required helpText="School-friendly class name.">
          <input id="create-class-name" name="name" placeholder="Class 1" required className="min-h-11 w-full" />
        </FormField>
        <FormField id="create-class-sort-order" label="Sort Order" helpText="Lower numbers appear first.">
          <input id="create-class-sort-order" name="sortOrder" type="number" min={0} max={10000} placeholder="1" className="min-h-11 w-full" />
        </FormField>
        <FormField id="create-class-status" label="Status">
          <select id="create-class-status" name="status" defaultValue="ACTIVE" className="min-h-11 w-full">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </FormField>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Creating...">Add Class</SubmitButton>
        </div>
        <FormField id="create-class-description" label="Description" className="md:col-span-5">
          <input id="create-class-description" name="description" placeholder="Optional note for school admins" className="min-h-11 w-full" />
        </FormField>
      </form>
      <SearchToolbar title={config.title} placeholder={config.searchPlaceholder} defaultValue={search} />
      {classes.length ? (
        <TableShell columns={config.columns}>
      {classes.map((academicClass) => (
        <tr key={academicClass.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{academicClass.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{academicClass.code}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={academicClass.status} /></td>
          <td className="whitespace-nowrap px-4 py-3">{academicClass.sortOrder}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(academicClass.updatedAt)}</td>
          <td className="whitespace-nowrap px-4 py-3">
            <TableActionLink href={`/academia/classes/${academicClass.id}/edit`} ariaLabel={`Edit class ${academicClass.name}`}>
              Edit
            </TableActionLink>
          </td>
        </tr>
      ))}
        </TableShell>
      ) : (
        <EmptyState title={config.emptyTitle} description="Use the form above to create the first class level for this tenant." />
      )}
    </div>
  );
}
