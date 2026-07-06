import Link from "next/link";
import type { StaffAttendanceReportBranchOption } from "@/modules/staffboard-lite/queries";
import { staffboardRoutes } from "@/modules/staffboard-lite/ui-config";
import { formatStaffAttendanceLabel } from "./staff-attendance-admin-state";
import {
  STAFF_ATTENDANCE_REPORT_STATUS_OPTIONS,
  STAFF_ATTENDANCE_REPORT_TYPE_OPTIONS
} from "./staff-attendance-report-state";

type StaffAttendanceReportFiltersProps = {
  branchOptions: StaffAttendanceReportBranchOption[];
  selectedBranchId: string | null;
  date: string;
  fromDate: string;
  toDate: string;
  staffType?: string;
  status?: string;
  department?: string;
  search?: string;
  month: number;
  year: number;
};

function branchLabel(branch: StaffAttendanceReportBranchOption) {
  return `${branch.name} (${branch.code})`;
}

export function StaffAttendanceReportFilters({
  branchOptions,
  selectedBranchId,
  date,
  fromDate,
  toDate,
  staffType,
  status,
  department,
  search,
  month,
  year
}: StaffAttendanceReportFiltersProps) {
  return (
    <form method="get" className="premium-card p-4" aria-label="Staff attendance report filters">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-sm font-semibold text-slate-950">Report filters</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Use one filter set across daily, date-range, monthly, and correction report sections.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="staff-report-branch" className="text-sm font-medium text-slate-700">
            Branch
          </label>
          <select id="staff-report-branch" name="branchId" defaultValue={selectedBranchId ?? ""} className="mt-2 min-h-11 w-full">
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branchLabel(branch)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-report-date" className="text-sm font-medium text-slate-700">
            Daily report date
          </label>
          <input id="staff-report-date" name="date" type="date" defaultValue={date} className="mt-2 min-h-11 w-full" />
        </div>

        <div>
          <label htmlFor="staff-report-from" className="text-sm font-medium text-slate-700">
            From date
          </label>
          <input id="staff-report-from" name="fromDate" type="date" defaultValue={fromDate} className="mt-2 min-h-11 w-full" />
        </div>

        <div>
          <label htmlFor="staff-report-to" className="text-sm font-medium text-slate-700">
            To date
          </label>
          <input id="staff-report-to" name="toDate" type="date" defaultValue={toDate} className="mt-2 min-h-11 w-full" />
        </div>

        <div>
          <label htmlFor="staff-report-type" className="text-sm font-medium text-slate-700">
            Staff type
          </label>
          <select id="staff-report-type" name="staffType" defaultValue={staffType ?? ""} className="mt-2 min-h-11 w-full">
            {STAFF_ATTENDANCE_REPORT_TYPE_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? formatStaffAttendanceLabel(option) : "All types"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-report-status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select id="staff-report-status" name="status" defaultValue={status ?? ""} className="mt-2 min-h-11 w-full">
            {STAFF_ATTENDANCE_REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? formatStaffAttendanceLabel(option) : "All statuses"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-report-department" className="text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            id="staff-report-department"
            name="department"
            defaultValue={department ?? ""}
            placeholder="Academics, Admin, Transport"
            className="mt-2 min-h-11 w-full"
          />
        </div>

        <div>
          <label htmlFor="staff-report-search" className="text-sm font-medium text-slate-700">
            Search staff
          </label>
          <input
            id="staff-report-search"
            name="search"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search staff by name, employee code, phone, or email"
            className="mt-2 min-h-11 w-full"
          />
        </div>

        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          <div>
            <label htmlFor="staff-report-month" className="text-sm font-medium text-slate-700">
              Month
            </label>
            <input id="staff-report-month" name="month" type="number" min={1} max={12} defaultValue={month} className="mt-2 min-h-11 w-full" />
          </div>
          <div>
            <label htmlFor="staff-report-year" className="text-sm font-medium text-slate-700">
              Year
            </label>
            <input id="staff-report-year" name="year" type="number" min={2000} max={2100} defaultValue={year} className="mt-2 min-h-11 w-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:flex sm:justify-end">
        <Link href={staffboardRoutes.reports} className="premium-secondary-button w-full sm:w-auto">
          Clear filters
        </Link>
        <button type="submit" className="premium-primary-button w-full sm:w-auto">
          Apply Filters
        </button>
      </div>
    </form>
  );
}
