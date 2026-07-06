import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/rbac/require-permission";
import { listAcademicYears, listInstitutions } from "@/modules/campus-core/queries";
import { activateAcademicYearAction, createAcademicYearAction } from "@/modules/campus-core/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveTable, StatusBadge } from "@/components/ui/table-primitives";
import { MobileListCard } from "@/components/mobile/mobile-list-card";

export default async function AcademicYearsPage() {
  const ctx = await requireAuth();
  await requirePermission({ ctx, permission: "campuscore.academic_year.manage" });
  const [years, institutions] = await Promise.all([listAcademicYears(ctx), listInstitutions(ctx)]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Academic Years</h1><p className="text-sm text-slate-500">Active academic-year context for future modules.</p></div>
      <form action={createAcademicYearAction} className="premium-card grid gap-3 p-4 sm:p-5 md:grid-cols-5">
        <select name="institutionId" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm">{institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <input name="name" placeholder="2026-27" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <input name="startDate" type="date" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <input name="endDate" type="date" required className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base md:text-sm" />
        <button className="min-h-12 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800">Create</button>
      </form>
      {years.length ? (
        <>
          <div className="grid gap-3 md:hidden" data-mobile-academic-year-cards="true">
            {years.map((y) => (
              <MobileListCard
                key={y.id}
                title={y.name}
                subtitle={y.institution.name}
                status={<StatusBadge value={y.isActive ? "ACTIVE" : "INACTIVE"} label={y.isActive ? "Active" : "Inactive"} />}
                meta={[
                  { label: "Status", value: <StatusBadge value={y.status} /> },
                ]}
                actions={
                  <form action={activateAcademicYearAction} className="w-full">
                    <input type="hidden" name="academicYearId" value={y.id} />
                    <button className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                      Activate
                    </button>
                  </form>
                }
              />
            ))}
          </div>
          <div className="hidden md:block">
            <ResponsiveTable columns={["Academic Year", "Institution", "Status", "Active", "Actions"]} caption="Academic years table">
              {years.map((y) => (
                <tr key={y.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{y.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{y.institution.name}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={y.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={y.isActive ? "ACTIVE" : "INACTIVE"} label={y.isActive ? "Active" : "Inactive"} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <form action={activateAcademicYearAction}>
                      <input type="hidden" name="academicYearId" value={y.id} />
                      <button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
                        Activate
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </div>
        </>
      ) : (
        <EmptyState title="No academic years yet" description="Create and activate the current school year." />
      )}
    </div>
  );
}
