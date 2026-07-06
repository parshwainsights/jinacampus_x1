"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-primitives";
import { correctStaffAttendanceAction } from "@/modules/staffboard-lite/actions/staff-attendance.actions";
import {
  formatStaffAttendanceDate,
  formatStaffAttendanceDateTime,
  formatStaffAttendanceLabel,
  formatWorkingMinutes,
  STAFF_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  staffAttendanceCorrectionErrorMessage,
  toDateTimeLocalValue,
  validateStaffAttendanceCorrectionDraft
} from "./staff-attendance-admin-state";

type StaffAttendanceCorrectionFormProps = {
  attendanceRecordId: string;
  employeeCode: string;
  staffName: string;
  attendanceDate: string;
  currentStatus: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workingMinutes: number | null;
  correctionReason: string | null;
};

export function StaffAttendanceCorrectionForm({
  attendanceRecordId,
  employeeCode,
  staffName,
  attendanceDate,
  currentStatus,
  checkInAt,
  checkOutAt,
  workingMinutes,
  correctionReason: existingCorrectionReason
}: StaffAttendanceCorrectionFormProps) {
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [status, setStatus] = useState(currentStatus === "NOT_MARKED" ? "PRESENT" : currentStatus);
  const [checkInValue, setCheckInValue] = useState(toDateTimeLocalValue(checkInAt));
  const [checkOutValue, setCheckOutValue] = useState(toDateTimeLocalValue(checkOutAt));
  const [correctionReason, setCorrectionReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCorrection() {
    setError(null);
    setMessage(null);

    const draftError = validateStaffAttendanceCorrectionDraft({
      correctionReason,
      checkInAt: checkInValue,
      checkOutAt: checkOutValue
    });
    if (draftError) {
      setError(draftError);
      return;
    }

    startTransition(async () => {
      const payload: {
        attendanceRecordId: string;
        status: string;
        correctionReason: string;
        checkInAt?: string;
        checkOutAt?: string;
      } = {
        attendanceRecordId,
        status,
        correctionReason
      };
      if (checkInValue) payload.checkInAt = new Date(checkInValue).toISOString();
      if (checkOutValue) payload.checkOutAt = new Date(checkOutValue).toISOString();

      const result = await correctStaffAttendanceAction(payload);
      if (result.ok) {
        setMessage(`Attendance corrected to ${formatStaffAttendanceLabel(result.data.newStatus)}.`);
        setCorrectionReason("");
        setStatus(result.data.newStatus);
        setCheckInValue(toDateTimeLocalValue(result.data.checkInAt));
        setCheckOutValue(toDateTimeLocalValue(result.data.checkOutAt));
        router.refresh();
      } else {
        setError(staffAttendanceCorrectionErrorMessage(result.code, result.error));
      }
    });
  }

  function cancelCorrection() {
    setStatus(currentStatus === "NOT_MARKED" ? "PRESENT" : currentStatus);
    setCheckInValue(toDateTimeLocalValue(checkInAt));
    setCheckOutValue(toDateTimeLocalValue(checkOutAt));
    setCorrectionReason("");
    setMessage(null);
    setError(null);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  const summaryItems = [
    { label: "Employee", value: `${employeeCode} · ${staffName}` },
    { label: "Date", value: formatStaffAttendanceDate(attendanceDate) },
    { label: "Current status", value: formatStaffAttendanceLabel(currentStatus) },
    { label: "Check-in", value: formatStaffAttendanceDateTime(checkInAt) },
    { label: "Check-out", value: formatStaffAttendanceDateTime(checkOutAt) },
    { label: "Working minutes", value: formatWorkingMinutes(workingMinutes) },
    { label: "Existing reason", value: existingCorrectionReason ?? "-" }
  ];
  const reasonError = error?.startsWith("Enter a correction reason") ? error : undefined;

  return (
    <details ref={detailsRef} className="w-[22rem] max-w-[85vw] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-950/10">
      <summary className="min-h-11 cursor-pointer text-sm font-medium text-brand-700">Correct</summary>
      <div className="mt-3 space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          Corrections are audit logged and should be used only after verification.
        </div>

        <dl className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs">
          {summaryItems.map((item) => (
            <div key={item.label} className="grid gap-0.5">
              <dt className="font-medium uppercase tracking-wide text-slate-400">{item.label}</dt>
              <dd className="break-words text-slate-700">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <label htmlFor={`${attendanceRecordId}-status`} className="text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id={`${attendanceRecordId}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={isPending}
            className="mt-1 min-h-11 w-full"
          >
            {STAFF_ATTENDANCE_CORRECTION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStaffAttendanceLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${attendanceRecordId}-check-in`} className="text-xs font-medium text-slate-600">
            Check-in time
          </label>
          <input
            id={`${attendanceRecordId}-check-in`}
            type="datetime-local"
            value={checkInValue}
            onChange={(event) => setCheckInValue(event.target.value)}
            disabled={isPending}
            className="mt-1 min-h-11 w-full"
          />
        </div>

        <div>
          <label htmlFor={`${attendanceRecordId}-check-out`} className="text-xs font-medium text-slate-600">
            Check-out time
          </label>
          <input
            id={`${attendanceRecordId}-check-out`}
            type="datetime-local"
            value={checkOutValue}
            onChange={(event) => setCheckOutValue(event.target.value)}
            disabled={isPending}
            className="mt-1 min-h-11 w-full"
          />
        </div>

        <FormField
          id={`${attendanceRecordId}-reason`}
          label="Correction reason"
          required
          helpText="Write a short, verified reason. This reason is saved for audit and future reporting."
          error={reasonError}
        >
          <textarea
            id={`${attendanceRecordId}-reason`}
            value={correctionReason}
            onChange={(event) => setCorrectionReason(event.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="Reason required"
            aria-invalid={Boolean(reasonError)}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:text-sm"
          />
        </FormField>

        <button
          type="button"
          onClick={submitCorrection}
          disabled={isPending}
          className="min-h-11 w-full rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Saving..." : "Save correction"}
        </button>
        <button
          type="button"
          onClick={cancelCorrection}
          disabled={isPending}
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-2 sm:mt-0 sm:w-auto"
        >
          Cancel
        </button>

        {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}
        {error && !reasonError ? <p role="alert" className="text-xs font-medium text-rose-700">{error}</p> : null}
      </div>
    </details>
  );
}
