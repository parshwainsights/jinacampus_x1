"use client";

import {
  ATTENDANCE_SUBMISSION_STATUSES,
  type AttendanceSubmissionStatus
} from "./attendance-form-state";

const statusLabels: Record<AttendanceSubmissionStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half-day",
  ON_LEAVE: "On leave",
  EXCUSED: "Excused"
};

export function AttendanceStatusSelect({
  id,
  value,
  disabled,
  onChange
}: {
  id: string;
  value: AttendanceSubmissionStatus | "";
  disabled?: boolean;
  onChange: (value: AttendanceSubmissionStatus | "") => void;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as AttendanceSubmissionStatus | "")}
      className="min-h-11 w-full min-w-40"
    >
      <option value="">Select status</option>
      {ATTENDANCE_SUBMISSION_STATUSES.map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}
