import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { StaffLeaveApplicationForm } from "@/modules/staffboard-lite/components/leave/staff-leave-application-form";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { getMyStaffLeaveWorkspace, getStaffLeaveApplicationDetail } from "@/modules/staffboard-lite/queries";

export default async function EditStaffLeavePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const ctx = await requireAuth();
  const { applicationId } = await params;
  const [{ application, ownApplication }, workspace] = await Promise.all([
    getStaffLeaveApplicationDetail(ctx, applicationId),
    getMyStaffLeaveWorkspace(ctx)
  ]);
  if (!ownApplication || !(["PENDING", "CLARIFICATION_REQUIRED"] as string[]).includes(application.status)) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Leave Application" description="Pending applications and clarification requests can be revised before approval." />
      <StaffLeaveApplicationForm
        leaveTypes={workspace.leaveTypes.map((type) => ({ id: type.id, name: type.name, code: type.code, allowHalfDay: type.allowHalfDay, supportingDocumentRequired: type.supportingDocumentRequired }))}
        initialApplication={{ id: application.id, leaveTypeId: application.leaveTypeId, startDate: application.startDate.toISOString().slice(0, 10), endDate: application.endDate.toISOString().slice(0, 10), duration: application.duration, reason: application.reason, staffClarification: application.staffClarification, status: application.status }}
      />
    </div>
  );
}
