import Link from "next/link";
import { PermissionState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/table-primitives";
import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";
import { getAdministratorDashboard } from "@/modules/campus-core/administrator-services";
import { AdministratorShell } from "@/modules/campus-core/components/administrator-shell";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value);
}

export default async function AdministratorHomePage() {
  const ctx = await requireAdministratorContext();

  try {
    const dashboard = await getAdministratorDashboard(ctx);
    const cards = [
      { label: "Total Schools", value: dashboard.totalSchools },
      { label: "Active Schools", value: dashboard.activeSchools },
      { label: "Inactive Schools", value: dashboard.inactiveSchools },
      { label: "Setup Needs Review", value: dashboard.schoolsNeedingSetup }
    ];

    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator">
        <section className="premium-section-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="premium-muted-chip">Platform Governance</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Administrator Overview</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage school tenants, School IDs, platform role boundaries, and school lifecycle status from one restricted portal.
              </p>
            </div>
            <Link href="/administrator/schools/create" className="premium-primary-button w-full premium-focus sm:w-auto">
              Create School
            </Link>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="premium-card p-5">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
            </div>
          ))}
        </section>
        <section className="premium-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recently Created Schools</h2>
              <p className="mt-1 text-sm text-slate-500">Latest tenant records in the platform registry.</p>
            </div>
            <Link href="/administrator/schools" className="premium-secondary-button w-full premium-focus sm:w-auto">
              View All Schools
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboard.recentlyCreatedSchools.length ? dashboard.recentlyCreatedSchools.map((school) => (
              <Link
                key={school.id}
                href={`/administrator/schools/${school.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 premium-focus sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-950">{school.name}</p>
                  <p className="mt-1 text-sm text-slate-500">School ID: {school.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={school.status} />
                  <span className="text-sm text-slate-500">{formatDate(school.createdAt)}</span>
                </div>
              </Link>
            )) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No schools have been created yet.</p>
            )}
          </div>
        </section>
      </AdministratorShell>
    );
  } catch {
    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator">
        <PermissionState
          title="Administrator access required"
          description="This portal is available only to authorized JinaCampus Super Admin or Administrator users."
        />
      </AdministratorShell>
    );
  }
}
