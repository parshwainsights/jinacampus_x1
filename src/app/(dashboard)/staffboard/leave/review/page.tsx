import Link from "next/link";
import { PermissionState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/table-primitives";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppError } from "@/lib/errors";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { listReviewableStaffLeaveApplications } from "@/modules/staffboard-lite/queries";

function name(person: { firstName: string; middleName: string | null; lastName: string | null }) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

export default async function StaffLeaveReviewPage() {
  const ctx = await requireAuth();
  const branchId = ctx.activeBranchId ?? (ctx.accessibleBranchIds.length === 1 ? ctx.accessibleBranchIds[0] : null);
  if (!branchId) return <PermissionState />;
  const permissions = await getEffectivePermissions({ ctx, branchId });
  if (!permissions.has("staffboard.leave.view")) return <PermissionState />;
  let applications;
  try {
    applications = await listReviewableStaffLeaveApplications(ctx, { branchId });
  } catch (error) {
    if (!(error instanceof AppError) || (error.status !== 403 && error.status !== 404)) throw error;
    return <PermissionState title="Leave review is not assigned" description="Only branch Principals and explicitly designated leave approvers can review staff applications." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Review branch-scoped staff leave. Approval synchronises authorised leave with attendance." />
      {permissions.has("staffboard.leave.settings.manage") ? (
        <div className="flex flex-wrap gap-2">
          <Link href="/staffboard/leave/settings" className="premium-secondary-button min-h-11">Leave settings</Link>
        </div>
      ) : null}
      <div className="space-y-3">
        {applications.length ? applications.map((application) => (
          <Link key={application.id} href={`/staffboard/leave/${application.id}`} className="premium-card block p-4 transition hover:border-brand-200 hover:shadow-elevated premium-focus">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-slate-950">{name(application.staff)} <span className="font-normal text-slate-500">({application.staff.employeeCode})</span></p><p className="mt-1 text-sm text-slate-500">{application.leaveType.name} · {application.startDate.toISOString().slice(0, 10)} to {application.endDate.toISOString().slice(0, 10)} · {application.totalDays.toNumber()} day(s)</p></div><StatusBadge value={application.status} /></div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{application.reason}</p>
          </Link>
        )) : <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No leave applications are available for this branch and year.</p>}
      </div>
    </div>
  );
}
