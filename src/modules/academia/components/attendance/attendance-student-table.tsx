"use client";

import { AttendanceStatusSelect } from "./attendance-status-select";
import type { AttendanceRow, AttendanceSubmissionStatus } from "./attendance-form-state";

function rowTone(status: AttendanceSubmissionStatus | "") {
  if (status === "ABSENT") return "bg-rose-50";
  if (status === "LATE" || status === "HALF_DAY") return "bg-amber-50";
  return "";
}

export function AttendanceStudentTable({
  rows,
  disabled,
  onStatusChange,
  onRemarksChange
}: {
  rows: AttendanceRow[];
  disabled?: boolean;
  onStatusChange: (studentId: string, status: AttendanceSubmissionStatus | "") => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden" data-mobile-student-attendance-cards="true">
        {rows.map((row) => {
          const statusId = `attendance-status-mobile-${row.studentId}`;
          const remarksId = `attendance-remarks-mobile-${row.studentId}`;
          return (
            <article key={row.studentId} className={`rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm ${rowTone(row.status)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">{row.displayName}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Roll {row.rollNumber ?? "-"} · Admission {row.admissionNo}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <label htmlFor={statusId} className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <AttendanceStatusSelect
                    id={statusId}
                    value={row.status}
                    disabled={disabled}
                    onChange={(status) => onStatusChange(row.studentId, status)}
                  />
                </div>
                <div>
                  <label htmlFor={remarksId} className="text-sm font-medium text-slate-700">
                    Remarks
                  </label>
                  <input
                    id={remarksId}
                    value={row.remarks}
                    disabled={disabled}
                    onChange={(event) => onRemarksChange(row.studentId, event.target.value)}
                    placeholder="Optional remarks"
                    className="mt-2 min-h-11 w-full"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="premium-card hidden overflow-hidden md:block">
        <div className="max-w-full overflow-x-auto overscroll-x-contain" data-mobile-table-shell="true" tabIndex={0}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Roll No.</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Admission No.</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Student Name</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row) => {
                const statusId = `attendance-status-${row.studentId}`;
                const remarksId = `attendance-remarks-${row.studentId}`;
                return (
                  <tr key={row.studentId} className={rowTone(row.status)}>
                    <td className="whitespace-nowrap px-4 py-3">{row.rollNumber ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.admissionNo}</td>
                    <td className="min-w-56 px-4 py-3 font-medium text-slate-900">{row.displayName}</td>
                    <td className="px-4 py-3">
                      <label htmlFor={statusId} className="sr-only">
                        Status for {row.displayName}
                      </label>
                      <AttendanceStatusSelect
                        id={statusId}
                        value={row.status}
                        disabled={disabled}
                        onChange={(status) => onStatusChange(row.studentId, status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label htmlFor={remarksId} className="sr-only">
                        Remarks for {row.displayName}
                      </label>
                      <input
                        id={remarksId}
                        value={row.remarks}
                        disabled={disabled}
                        onChange={(event) => onRemarksChange(row.studentId, event.target.value)}
                        placeholder="Optional remarks"
                        className="min-h-11 w-full min-w-52"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
