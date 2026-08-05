"use client";

import { useActionState } from "react";
import {
  cancelStaffLeaveApplicationAction,
  reviewStaffLeaveApplicationAction,
  withdrawStaffLeaveApplicationAction,
  type StaffLeaveActionState
} from "@/modules/staffboard-lite/actions/staff-leave.actions";

const initialState: StaffLeaveActionState = { ok: false };

function ActionMessage({ state }: { state: StaffLeaveActionState }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{state.message}</p>;
}
export function StaffLeaveDecisionForms({
  applicationId,
  status,
  ownApplication,
  canReview
}: {
  applicationId: string;
  status: string;
  ownApplication: boolean;
  canReview: boolean;
}) {
  const [reviewState, reviewAction, reviewPending] = useActionState(reviewStaffLeaveApplicationAction, initialState);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(withdrawStaffLeaveApplicationAction, initialState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelStaffLeaveApplicationAction, initialState);
  const pendingReview = status === "PENDING" || status === "CLARIFICATION_REQUIRED";

  return (
    <div className="space-y-4">
      {canReview && pendingReview ? (
        <form action={reviewAction} className="premium-card space-y-4 p-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <div>
            <h2 className="text-base font-semibold text-slate-950">Review application</h2>
            <p className="mt-1 text-sm text-slate-500">Approval reserves tracked balance and writes leave to staff attendance in one transaction.</p>
          </div>
          <ActionMessage state={reviewState} />
          <label className="text-sm font-semibold text-slate-700">
            Approver remarks
            <textarea name="remarks" rows={4} maxLength={1000} disabled={reviewPending} className="mt-2 w-full" />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <button name="decision" value="APPROVE" disabled={reviewPending} className="premium-primary-button min-h-11">Approve</button>
            <button name="decision" value="REQUEST_CLARIFICATION" disabled={reviewPending} className="premium-secondary-button min-h-11">Request clarification</button>
            <button name="decision" value="REJECT" disabled={reviewPending} className="min-h-11 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50">Reject</button>
          </div>
        </form>
      ) : null}

      {ownApplication && pendingReview ? (
        <form action={withdrawAction} className="premium-card space-y-3 p-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <h2 className="text-base font-semibold text-slate-950">Withdraw application</h2>
          <ActionMessage state={withdrawState} />
          <label className="text-sm font-semibold text-slate-700">
            Note (optional)
            <textarea name="remarks" rows={3} maxLength={1000} disabled={withdrawPending} className="mt-2 w-full" />
          </label>
          <button disabled={withdrawPending} className="premium-secondary-button min-h-11">{withdrawPending ? "Withdrawing..." : "Withdraw application"}</button>
        </form>
      ) : null}

      {canReview && status === "APPROVED" ? (
        <form action={cancelAction} className="premium-card space-y-3 border-amber-200 p-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <div>
            <h2 className="text-base font-semibold text-slate-950">Cancel approved leave</h2>
            <p className="mt-1 text-sm text-slate-500">Only future leave without check-in activity can be cancelled here.</p>
          </div>
          <ActionMessage state={cancelState} />
          <label className="text-sm font-semibold text-slate-700">
            Cancellation reason
            <textarea name="remarks" rows={3} minLength={10} maxLength={1000} required disabled={cancelPending} className="mt-2 w-full" />
          </label>
          <button disabled={cancelPending} className="min-h-11 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100">{cancelPending ? "Cancelling..." : "Cancel approved leave"}</button>
        </form>
      ) : null}
    </div>
  );
}
