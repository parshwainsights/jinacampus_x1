import { requireAuth } from "@/lib/auth/require-auth";
import { listEnrollments } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  formatDateTime,
  ListPageShell,
  resolveSearchParam,
  StatusPill,
  TableActionLink,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function EnrollmentsPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const enrollments = await listEnrollments(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.enrollments} search={search} rowCount={enrollments.length}>
      {enrollments.map((enrollment) => (
        <tr key={enrollment.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{enrollment.student.displayName ?? enrollment.student.admissionNumber}</td>
          <td className="whitespace-nowrap px-4 py-3">{enrollment.classSection.displayName}</td>
          <td className="whitespace-nowrap px-4 py-3">{enrollment.rollNumber ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(enrollment.enrolledOn)}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={enrollment.status} /></td>
          <td className="whitespace-nowrap px-4 py-3">
            <TableActionLink
              href={`/academia/enrollments/${enrollment.id}/edit`}
              ariaLabel={`Edit enrollment for ${enrollment.student.displayName ?? enrollment.student.admissionNumber}`}
            >
              Edit
            </TableActionLink>
          </td>
        </tr>
      ))}
    </ListPageShell>
  );
}
