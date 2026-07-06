import { requireAuth } from "@/lib/auth/require-auth";
import { listClassSections } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  ListPageShell,
  ReadOnlyAction,
  resolveSearchParam,
  StatusPill,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function ClassSectionsPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const classSections = await listClassSections(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.classSections} search={search} rowCount={classSections.length}>
      {classSections.map((classSection) => (
        <tr key={classSection.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{classSection.academicClass.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{classSection.section.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{classSection.branch.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{classSection.academicYear.name}</td>
          <td className="whitespace-nowrap px-4 py-3">{classSection.classTeacherUser?.displayName ?? classSection.classTeacherUser?.email ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">{classSection.capacity ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={classSection.status} /></td>
          <td className="whitespace-nowrap px-4 py-3"><ReadOnlyAction /></td>
        </tr>
      ))}
    </ListPageShell>
  );
}
