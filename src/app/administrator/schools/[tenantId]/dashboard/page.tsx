import Link from "next/link";
import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/table-primitives";
import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";
import { getSchoolDashboardForAdministrator } from "@/modules/campus-core/administrator-services";
import { AdministratorShell } from "@/modules/campus-core/components/administrator-shell";

type PageParams = Promise<{ tenantId: string }>;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function isNextNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: unknown }).digest).includes("NEXT_NOT_FOUND");
}

function MetricCard({
  label,
  value,
  description
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      {description ? <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p> : null}
    </div>
  );
}

function InlineMetric({
  label,
  value,
  description
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
  primary = false
}: {
  href: string;
  label: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-2xl border p-4 shadow-sm transition premium-focus",
        primary
          ? "border-brand-200 bg-brand-50/90 text-brand-800 hover:bg-brand-100/80"
          : "border-slate-200 bg-white/80 text-slate-800 hover:border-brand-200 hover:bg-brand-50/45"
      ].join(" ")}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </Link>
  );
}

export default async function AdministratorSchoolDashboardPage({ params }: { params: PageParams }) {
  const ctx = await requireAdministratorContext();
  const { tenantId } = await params;

  try {
    const dashboard = await getSchoolDashboardForAdministrator(ctx, tenantId);
    if (!dashboard) notFound();
    const { school, metrics, todayAttendance, notifications } = dashboard;
    const primaryInstitution = school.institutions[0] ?? null;

    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools">
        <section className="premium-section-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value="INFO" label="Administrator View" />
                <span className="premium-muted-chip">School ID: {school.slug}</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{school.name}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                You are viewing this school as Administrator. This read-only inspection dashboard does not impersonate school users or change your session context.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge value={school.status} />
                <span className="text-sm text-slate-500">Updated {formatDate(school.updatedAt)}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:flex sm:items-center">
              <Link href="/administrator" className="premium-secondary-button w-full premium-focus sm:w-auto">
                Return to Administrator Dashboard
              </Link>
              <Link href="/administrator/schools" className="premium-primary-button w-full premium-focus sm:w-auto">
                Back to Schools
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Branches" value={metrics.branches} description={`${metrics.activeBranches} active branches`} />
          <MetricCard label="Users" value={metrics.users} description={`${metrics.activeUsers} active user accounts`} />
          <MetricCard label="Students" value={metrics.students} description={`${metrics.activeStudents} active students`} />
          <MetricCard label="Staff" value={metrics.staffProfiles} description={`${metrics.activeStaff} active staff profiles`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="premium-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Today Attendance Snapshot</h3>
                <p className="mt-1 text-sm text-slate-500">School-scoped records for {todayAttendance.date}.</p>
              </div>
              <StatusBadge value="INFO" label={`${metrics.activeAcademicYears} active year${metrics.activeAcademicYears === 1 ? "" : "s"}`} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InlineMetric label="Student Records" value={todayAttendance.studentRecordsMarked} description="Marked student attendance records" />
              <InlineMetric label="Staff Records" value={todayAttendance.staffRecords} description="Staff attendance records" />
              <InlineMetric label="Checked In" value={todayAttendance.staffCheckedIn} description="Staff with check-in time" />
            </div>
          </div>

          <div className="premium-card p-5">
            <h3 className="text-lg font-semibold text-slate-950">Notification Foundation</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Read-only status for attendance notification controls. Provider secrets are never displayed here.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-950">Attendance notification branches</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{notifications.attendanceNotificationBranches}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-950">Enabled WhatsApp providers</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{notifications.enabledWhatsAppProviders}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-950">Outbox items</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{metrics.notificationOutboxItems}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="premium-card p-5">
            <h3 className="text-lg font-semibold text-slate-950">School Context</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Institution</p>
                <p className="mt-2 font-semibold text-slate-950">{primaryInstitution?.displayName ?? primaryInstitution?.name ?? "Not configured"}</p>
                <p className="mt-1 text-sm text-slate-500">Logo: {primaryInstitution?.logoUrl ? "Configured" : "Fallback initials"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support</p>
                <p className="mt-2 font-semibold text-slate-950">{school.supportEmail ?? "Not set"}</p>
                <p className="mt-1 text-sm text-slate-500">{school.phone ?? "No phone configured"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lifecycle</p>
                <p className="mt-2 text-sm text-slate-500">Created {formatDate(school.createdAt)}</p>
                <p className="mt-1 text-sm text-slate-500">Legal name: {school.legalName ?? "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-5">
            <h3 className="text-lg font-semibold text-slate-950">Quick Links</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              These links stay inside the administrator portal. School operations still require normal school-user access.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickLink
                href={`/administrator/schools/${school.id}/edit`}
                label="Edit School"
                description="Update school profile, branding, lifecycle status, or School ID."
                primary
              />
              <QuickLink
                href={`/administrator/schools/${school.id}`}
                label="View School Details"
                description="Review institutions, branches, principals, and dependency summary."
              />
              <QuickLink
                href="/administrator/schools"
                label="Back to Schools"
                description="Return to the school registry and select another school."
              />
              <QuickLink
                href="/administrator"
                label="Return to Administrator Dashboard"
                description="Go back to platform-level overview cards and recent schools."
              />
            </div>
          </div>
        </section>
      </AdministratorShell>
    );
  } catch (error) {
    if (isNextNotFound(error)) throw error;
    return (
      <AdministratorShell ctx={ctx} activeHref="/administrator/schools">
        <PermissionState
          title="Administrator school dashboard unavailable"
          description="Your account does not have permission to inspect this school dashboard."
        />
      </AdministratorShell>
    );
  }
}
