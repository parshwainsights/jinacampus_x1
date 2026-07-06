import { requireAuth } from "@/lib/auth/require-auth";
import { listGuardians } from "@/modules/academia/queries";
import { academiaListPageConfigs } from "@/modules/academia/ui-config";
import {
  ListPageShell,
  resolveSearchParam,
  TableActionLink,
  type RouteSearchParams
} from "@/modules/academia/components/academia-page-shell";

export default async function GuardiansPage({ searchParams }: { searchParams?: RouteSearchParams }) {
  const ctx = await requireAuth();
  const search = await resolveSearchParam(searchParams);
  const guardians = await listGuardians(ctx, { search });

  return (
    <ListPageShell config={academiaListPageConfigs.guardians} search={search} rowCount={guardians.length}>
      {guardians.map((guardian) => (
        <tr key={guardian.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{guardian.displayName ?? [guardian.firstName, guardian.lastName].filter(Boolean).join(" ")}</td>
          <td className="whitespace-nowrap px-4 py-3">{guardian.phone ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">{guardian.email ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">-</td>
          <td className="whitespace-nowrap px-4 py-3">-</td>
          <td className="whitespace-nowrap px-4 py-3">
            <TableActionLink
              href={`/academia/guardians/${guardian.id}/edit`}
              ariaLabel={`Edit guardian ${guardian.displayName ?? guardian.firstName}`}
            >
              Edit
            </TableActionLink>
          </td>
        </tr>
      ))}
    </ListPageShell>
  );
}
