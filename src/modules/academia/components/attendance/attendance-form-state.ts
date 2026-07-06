import type { StudentAttendanceMarkingState } from "@/modules/academia/queries";

export const ATTENDANCE_SUBMISSION_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "EXCUSED"
] as const;

export type AttendanceSubmissionStatus = (typeof ATTENDANCE_SUBMISSION_STATUSES)[number];

export type AttendanceRow = {
  enrollmentId: string;
  studentId: string;
  admissionNo: string;
  rollNumber: string | null;
  displayName: string;
  status: AttendanceSubmissionStatus | "";
  remarks: string;
  lockedAt: string | null;
};

type BuildSubmitPayloadInput = {
  classSectionId: string;
  attendanceDate: string;
  rows: AttendanceRow[];
};

export type AttendanceSubmitPayload = {
  classSectionId: string;
  attendanceDate: string;
  sessionType: "FULL_DAY";
  entries: Array<{
    studentId: string;
    status: AttendanceSubmissionStatus;
    remarks?: string;
  }>;
};

export function createRowsFromMarkingState(state: StudentAttendanceMarkingState): AttendanceRow[] {
  return state.students.map((student) => ({
    enrollmentId: student.enrollmentId,
    studentId: student.studentId,
    admissionNo: student.admissionNo,
    rollNumber: student.rollNumber,
    displayName: student.displayName,
    status: student.attendanceStatus === "NOT_MARKED" ? "" : student.attendanceStatus,
    remarks: student.remarks,
    lockedAt: student.lockedAt
  }));
}

export function markAllPresent(rows: AttendanceRow[]) {
  return rows.map((row) => ({ ...row, status: "PRESENT" as const }));
}

export function updateAttendanceRow(
  rows: AttendanceRow[],
  studentId: string,
  patch: Partial<Pick<AttendanceRow, "status" | "remarks">>
) {
  return rows.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row));
}

export function canSubmitAttendance(input: { rows: AttendanceRow[]; isLocked: boolean; isSubmitting: boolean }) {
  return input.rows.length > 0 && !input.isLocked && !input.isSubmitting;
}

export function countRiskStatuses(rows: AttendanceRow[]) {
  return rows.filter((row) => row.status === "ABSENT" || row.status === "LATE" || row.status === "HALF_DAY").length;
}

export function buildSubmitPayload(input: BuildSubmitPayloadInput):
  | { ok: true; payload: AttendanceSubmitPayload }
  | { ok: false; error: string } {
  if (input.rows.length === 0) {
    return { ok: false, error: "Load active enrolled students before submitting attendance." };
  }

  const missingStatus = input.rows.find((row) => !row.status);
  if (missingStatus) {
    return { ok: false, error: `Select a status for ${missingStatus.displayName}.` };
  }

  return {
    ok: true,
    payload: {
      classSectionId: input.classSectionId,
      attendanceDate: input.attendanceDate,
      sessionType: "FULL_DAY",
      entries: input.rows.map((row) => ({
        studentId: row.studentId,
        status: row.status as AttendanceSubmissionStatus,
        remarks: row.remarks || undefined
      }))
    }
  };
}
