import { requireAuth } from "@/lib/auth/require-auth";
import { listClasses } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  formatDateTime,
  ListPageShell,
  resolveSearchParam,
  StatusPill,
  TableActionLink,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function ClassesPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const classes = await listClasses(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.classes} search={search} rowCount={classes.length}>
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
    </ListPageShell>
  );
}
