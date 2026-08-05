"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveStaffLeaveApplicationAction,
  type StaffLeaveActionState
} from "@/modules/staffboard-lite/actions/staff-leave.actions";

const initialState: StaffLeaveActionState = { ok: false };

type LeaveTypeOption = {
  id: string;
  name: string;
  code: string;
  allowHalfDay: boolean;
  supportingDocumentRequired: boolean;
};

type InitialApplication = {
  id: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  duration: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  reason: string;
  staffClarification?: string | null;
  status: string;
};

function fieldError(state: StaffLeaveActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}
export function StaffLeaveApplicationForm({
  leaveTypes,
  initialApplication
}: {
  leaveTypes: LeaveTypeOption[];
  initialApplication?: InitialApplication;
}) {
  const [state, action, pending] = useActionState(saveStaffLeaveApplicationAction, initialState);

  return (
    <form action={action} className="premium-card space-y-5 p-4 sm:p-5">
      {initialApplication ? <input type="hidden" name="applicationId" value={initialApplication.id} /> : null}
      {state.message ? (
        <p role={state.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Leave type
          <select name="leaveTypeId" defaultValue={initialApplication?.leaveTypeId ?? ""} disabled={pending} required className="mt-2 min-h-11 w-full">
            <option value="" disabled>Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.code}){type.supportingDocumentRequired ? " - document required" : ""}
              </option>
            ))}
          </select>
          {fieldError(state, "leaveTypeId") ? <span className="mt-1 block text-xs text-rose-700">{fieldError(state, "leaveTypeId")}</span> : null}
        </label>

        <label className="text-sm font-semibold text-slate-700">
          From
          <input name="startDate" type="date" defaultValue={initialApplication?.startDate} disabled={pending} required className="mt-2 min-h-11 w-full" />
          {fieldError(state, "startDate") ? <span className="mt-1 block text-xs text-rose-700">{fieldError(state, "startDate")}</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-700">
          To
          <input name="endDate" type="date" defaultValue={initialApplication?.endDate} disabled={pending} required className="mt-2 min-h-11 w-full" />
          {fieldError(state, "endDate") ? <span className="mt-1 block text-xs text-rose-700">{fieldError(state, "endDate")}</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Duration
          <select name="duration" defaultValue={initialApplication?.duration ?? "FULL_DAY"} disabled={pending} className="mt-2 min-h-11 w-full">
            <option value="FULL_DAY">Full day</option>
            <option value="FIRST_HALF">First half</option>
            <option value="SECOND_HALF">Second half</option>
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">Half-day leave must use the same From and To date.</span>
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Reason
          <textarea name="reason" rows={5} maxLength={1000} defaultValue={initialApplication?.reason} disabled={pending} required className="mt-2 w-full" />
          {fieldError(state, "reason") ? <span className="mt-1 block text-xs text-rose-700">{fieldError(state, "reason")}</span> : null}
        </label>
        {initialApplication?.status === "CLARIFICATION_REQUIRED" ? (
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">
            Clarification
            <textarea name="staffClarification" rows={4} maxLength={1000} defaultValue={initialApplication.staffClarification ?? ""} disabled={pending} className="mt-2 w-full" />
          </label>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/staffboard/leave" className="premium-secondary-button min-h-11">Back to leave</Link>
        <button type="submit" disabled={pending || leaveTypes.length === 0} className="premium-primary-button min-h-11 disabled:opacity-60">
          {pending ? "Saving..." : initialApplication ? "Update application" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
