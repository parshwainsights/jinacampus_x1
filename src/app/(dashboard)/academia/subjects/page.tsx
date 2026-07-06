import { requireAuth } from "@/lib/auth/require-auth";
import { listSubjects } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  formatDateTime,
  ListPageShell,
  resolveSearchParam,
  StatusPill,
  TableActionLink,
  formatEnumLabel,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function SubjectsPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const subjects = await listSubjects(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.subjects} search={search} rowCount={subjects.length}>
      {subjects.map((subject) => (
        <tr key={subject.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{subject.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{subject.code}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatEnumLabel(subject.type)}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={subject.status} /></td>
          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(subject.updatedAt)}</td>
          <td className="whitespace-nowrap px-4 py-3">
            <TableActionLink href={`/academia/subjects/${subject.id}/edit`} ariaLabel={`Edit subject ${subject.name}`}>
              Edit
            </TableActionLink>
          </td>
        </tr>
      ))}
    </ListPageShell>
  );
}
