import { PermissionState } from "@/components/ui/empty-state";
import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";
import { getAdministratorDashboard } from "@/modules/campus-core/administrator-services";
import { AdministratorShell } from "@/modules/campus-core/components/administrator-shell";
import { CreateSchoolForm } from "@/modules/campus-core/components/administrator-school-forms";

export default async function CreateAdministratorSchoolPage() {
  const ctx = await requireAdministratorContext();

  try {
    await getAdministratorDashboard(ctx);
    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools/create">
        <section className="premium-section-shell">
          <p className="premium-muted-chip">New School</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create School Tenant</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Use a customer-safe School ID. Do not reuse reserved platform route names or internal admin labels.
          </p>
        </section>
        <CreateSchoolForm />
      </AdministratorShell>
    );
  } catch {
    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools/create">
        <PermissionState
          title="Create school unavailable"
          description="Your administrator account does not have permission to create schools."
        />
      </AdministratorShell>
    );
  }
}
