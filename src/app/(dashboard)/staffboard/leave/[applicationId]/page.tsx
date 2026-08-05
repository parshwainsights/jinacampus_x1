import Link from "next/link";
import { notFound as renderNotFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/table-primitives";
import { requireAuth } from "@/lib/auth/require-auth";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { StaffLeaveDecisionForms } from "@/modules/staffboard-lite/components/leave/staff-leave-decision-forms";
import { StaffLeaveDocumentsPanel } from "@/modules/staffboard-lite/components/leave/staff-leave-documents-panel";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { getStaffLeaveApplicationDetail } from "@/modules/staffboard-lite/queries";

function personName(person: { displayName?: string | null; firstName: string; lastName?: string | null; middleName?: string | null }) {
  return person.displayName ?? [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

export default async function StaffLeaveDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const ctx = await requireAuth();
  const { applicationId } = await params;
  let detail;
  try {
    detail = await getStaffLeaveApplicationDetail(ctx, applicationId);
  } catch (error) {
    if (error instanceof AppError && (error.status === 403 || error.status === 404)) {
      renderNotFound();
    }
    throw error;
  }
  const { application, ownApplication } = detail;
  const permissions = await getEffectivePermissions({ ctx, branchId: application.branchId });
  const canReview = !ownApplication && permissions.has("staffboard.leave.approve");
  const canEdit = ownApplication && (application.status === "PENDING" || application.status === "CLARIFICATION_REQUIRED");

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Application" description={`${personName(application.staff)} · ${application.staff.employeeCode}`} />
      <div className="flex flex-wrap gap-2"><Link href={ownApplication ? "/staffboard/leave" : "/staffboard/leave/review"} className="premium-secondary-button min-h-11">Back</Link>{canEdit ? <Link href={`/staffboard/leave/${application.id}/edit`} className="premium-primary-button min-h-11">Edit application</Link> : null}</div>
      <section className="premium-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-slate-500">{application.leaveType.name} ({application.leaveType.code})</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{application.startDate.toISOString().slice(0, 10)} to {application.endDate.toISOString().slice(0, 10)}</h2><p className="mt-1 text-sm text-slate-500">{application.totalDays.toNumber()} day(s) · {application.duration.replaceAll("_", " ").toLowerCase()}</p></div><StatusBadge value={application.status} /></div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Reason</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{application.reason}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Approver remarks</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{application.approverRemarks ?? "No remarks"}</dd></div>{application.staffClarification ? <div className="md:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-500">Staff clarification</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{application.staffClarification}</dd></div> : null}</dl>
      </section>
      <StaffLeaveDocumentsPanel applicationId={application.id} documents={application.documents.map((document) => ({ ...document, createdAt: document.createdAt.toISOString() }))} canEdit={canEdit} maxBytes={env.STAFF_LEAVE_DOCUMENT_MAX_BYTES} />
      <StaffLeaveDecisionForms applicationId={application.id} status={application.status} ownApplication={ownApplication} canReview={canReview} />
      <section className="premium-card p-4"><h2 className="text-base font-semibold text-slate-950">Action history</h2><div className="mt-4 space-y-3">{application.actions.map((entry) => <div key={entry.id} className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-semibold text-slate-900">{entry.action.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 text-xs text-slate-500">{entry.createdAt.toLocaleString("en-IN")} · {entry.actor ? personName(entry.actor) : "System"}</p>{entry.remarks ? <p className="mt-1 text-sm text-slate-600">{entry.remarks}</p> : null}</div>)}</div></section>
    </div>
  );
}
