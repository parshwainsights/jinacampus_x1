import { requireAuth } from "@/lib/auth/require-auth";
import { listSections } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  formatDateTime,
  ListPageShell,
  resolveSearchParam,
  StatusPill,
  TableActionLink,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function SectionsPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const sections = await listSections(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.sections} search={search} rowCount={sections.length}>
      {sections.map((section) => (
        <tr key={section.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{section.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{section.code}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={section.status} /></td>
          <td className="whitespace-nowrap px-4 py-3">{section.sortOrder}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(section.updatedAt)}</td>
          <td className="whitespace-nowrap px-4 py-3">
            <TableActionLink href={`/academia/sections/${section.id}/edit`} ariaLabel={`Edit section ${section.name}`}>
              Edit
            </TableActionLink>
          </td>
        </tr>
      ))}
    </ListPageShell>
  );
}
