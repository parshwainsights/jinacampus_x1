import { requireAuth } from "@/lib/auth/require-auth";
import { StaffLeaveApplicationForm } from "@/modules/staffboard-lite/components/leave/staff-leave-application-form";
import { PageHeader } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { getMyStaffLeaveWorkspace } from "@/modules/staffboard-lite/queries";

export default async function ApplyStaffLeavePage() {
  const ctx = await requireAuth();
  const workspace = await getMyStaffLeaveWorkspace(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title="Apply for Leave" description="Choose dates and a configured leave type. Total working days and entitlement are calculated server-side." />
      <StaffLeaveApplicationForm leaveTypes={workspace.leaveTypes.map((type) => ({ id: type.id, name: type.name, code: type.code, allowHalfDay: type.allowHalfDay, supportingDocumentRequired: type.supportingDocumentRequired }))} />
    </div>
  );
}
