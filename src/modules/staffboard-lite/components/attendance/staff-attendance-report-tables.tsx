import { NoResultsState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/table-primitives";
import { TableShell } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import type {
  MonthlyStaffAttendanceSummaryRow,
  StaffAttendanceReportRow,
  StaffManualCorrectionReportRow
} from "@/modules/staffboard-lite/queries";
import {
  formatStaffAttendanceDateTime,
  formatStaffAttendanceLabel,
  formatWorkingMinutes
} from "./staff-attendance-admin-state";
import { formatStaffAttendanceReportDate } from "./staff-attendance-report-state";

type ReportSectionProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  rowCount: number;
  children: React.ReactNode;
};

type AttendanceRowsTableProps = {
  rows: StaffAttendanceReportRow[];
};

type NamedAttendanceRowsTableProps = AttendanceRowsTableProps & {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

const attendanceColumns = [
  "Date",
  "Employee Code",
  "Staff Name",
  "Staff Type",
  "Department",
  "Status",
  "Check-in",
  "Check-out",
  "Working Minutes",
  "Source",
  "Correction Reason"
] as const;

export function StaffAttendanceReportSection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  rowCount,
  children
}: ReportSectionProps) {
  return (
    <section className="min-w-0 space-y-3" aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {rowCount > 0 ? children : <NoResultsState title={emptyTitle} description={emptyDescription} />}
    </section>
  );
}

export function StaffAttendanceRowsTable({ rows }: AttendanceRowsTableProps) {
  return (
    <TableShell columns={attendanceColumns}>
      {rows.map((row) => (
        <tr key={row.attendanceRecordId}>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceReportDate(row.attendanceDate)}</td>
          <td className="whitespace-nowrap px-4 py-3">{row.employeeCode}</td>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.staffName}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceLabel(row.staffType)}</td>
          <td className="whitespace-nowrap px-4 py-3">{row.department ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={row.status} label={formatStaffAttendanceLabel(row.status)} /></td>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceDateTime(row.checkInAt)}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceDateTime(row.checkOutAt)}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatWorkingMinutes(row.workingMinutes)}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceLabel(row.source)}</td>
          <td className="max-w-72 px-4 py-3 text-sm leading-6 text-slate-600">{row.correctionReason ?? "-"}</td>
        </tr>
      ))}
    </TableShell>
  );
}

export function NamedStaffAttendanceRowsTable({
  title,
  description,
  emptyTitle,
  emptyDescription,
  rows
}: NamedAttendanceRowsTableProps) {
  return (
    <StaffAttendanceReportSection
      title={title}
      description={description}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      rowCount={rows.length}
    >
      <StaffAttendanceRowsTable rows={rows} />
    </StaffAttendanceReportSection>
  );
}

export function StaffMonthlySummaryTable({ rows }: { rows: MonthlyStaffAttendanceSummaryRow[] }) {
  return (
    <StaffAttendanceReportSection
      title="Monthly Staff Attendance Summary"
      description="Counts only existing staff attendance records for the selected month. Missing days are not inferred as absent."
      emptyTitle="No monthly staff attendance rows"
      emptyDescription="Marked staff attendance records for the selected month will appear here."
      rowCount={rows.length}
    >
      <TableShell columns={[
        "Employee Code",
        "Staff Name",
        "Staff Type",
        "Department",
        "Present",
        "Late",
        "Half Day",
        "Absent",
        "On Leave",
        "Holiday / Week Off",
        "Marked Days",
        "Working Minutes"
      ]}>
        {rows.map((row) => (
          <tr key={row.staffId}>
            <td className="whitespace-nowrap px-4 py-3">{row.employeeCode}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.staffName}</td>
            <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceLabel(row.staffType)}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.department ?? "-"}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.presentDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.lateDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.halfDayDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.absentDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.onLeaveDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.holidayWeekOffDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.markedDays}</td>
            <td className="whitespace-nowrap px-4 py-3">{formatWorkingMinutes(row.totalWorkingMinutes)}</td>
          </tr>
        ))}
      </TableShell>
    </StaffAttendanceReportSection>
  );
}

export function StaffCorrectionReportTable({ rows }: { rows: StaffManualCorrectionReportRow[] }) {
  return (
    <StaffAttendanceReportSection
      title="Manual Correction Report"
      description="Attendance records corrected by authorized staff with a mandatory reason."
      emptyTitle="No manual corrections"
      emptyDescription="Correction records for the selected date range will appear here."
      rowCount={rows.length}
    >
      <TableShell columns={["Date", "Employee Code", "Staff Name", "Status", "Correction Reason", "Updated By", "Updated At"]}>
        {rows.map((row) => (
          <tr key={row.attendanceRecordId}>
            <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceReportDate(row.attendanceDate)}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.employeeCode}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.staffName}</td>
            <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={row.status} label={formatStaffAttendanceLabel(row.status)} /></td>
            <td className="max-w-96 px-4 py-3 text-sm leading-6 text-slate-600">{row.correctionReason}</td>
            <td className="whitespace-nowrap px-4 py-3">{row.updatedByName ?? "-"}</td>
            <td className="whitespace-nowrap px-4 py-3">{formatStaffAttendanceDateTime(row.updatedAt)}</td>
          </tr>
        ))}
      </TableShell>
    </StaffAttendanceReportSection>
  );
}
