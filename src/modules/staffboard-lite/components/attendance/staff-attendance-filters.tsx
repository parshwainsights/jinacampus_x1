import Link from "next/link";
import type { StaffAttendanceBranchOption } from "@/modules/staffboard-lite/queries";
import { staffboardRoutes } from "@/modules/staffboard-lite/ui-config";
import {
  formatStaffAttendanceLabel,
  STAFF_ATTENDANCE_STATUS_OPTIONS,
  STAFF_TYPE_FILTER_OPTIONS
} from "./staff-attendance-admin-state";

type StaffAttendanceFiltersProps = {
  branchOptions: StaffAttendanceBranchOption[];
  selectedBranchId: string | null;
  selectedDate: string;
  staffType?: string;
  status?: string;
  search?: string;
};

function branchLabel(branch: StaffAttendanceBranchOption) {
  return `${branch.name} (${branch.code})`;
}

export function StaffAttendanceFilters({
  branchOptions,
  selectedBranchId,
  selectedDate,
  staffType,
  status,
  search
}: StaffAttendanceFiltersProps) {
  return (
    <form method="get" className="premium-card p-4" aria-label="Staff attendance filters">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-sm font-semibold text-slate-950">Attendance filters</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Filter the daily table by branch, date, staff type, status, or staff search details.
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr_auto] lg:items-end">
        <div>
          <label htmlFor="staff-attendance-branch" className="text-sm font-medium text-slate-700">
            Branch
          </label>
          <select id="staff-attendance-branch" name="branchId" defaultValue={selectedBranchId ?? ""} className="mt-2 min-h-11 w-full">
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branchLabel(branch)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-attendance-date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input id="staff-attendance-date" name="date" type="date" defaultValue={selectedDate} className="mt-2 min-h-11 w-full" />
        </div>

        <div>
          <label htmlFor="staff-attendance-type" className="text-sm font-medium text-slate-700">
            Staff type
          </label>
          <select id="staff-attendance-type" name="staffType" defaultValue={staffType ?? ""} className="mt-2 min-h-11 w-full">
            <option value="">All types</option>
            {STAFF_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStaffAttendanceLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-attendance-status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select id="staff-attendance-status" name="status" defaultValue={status ?? ""} className="mt-2 min-h-11 w-full">
            <option value="">All statuses</option>
            {STAFF_ATTENDANCE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStaffAttendanceLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="staff-attendance-search" className="text-sm font-medium text-slate-700">
            Search staff
          </label>
          <input
            id="staff-attendance-search"
            name="search"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search staff by name, employee code, department, phone, or email"
            className="mt-2 min-h-11 w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Link href={staffboardRoutes.attendance} className="premium-secondary-button w-full lg:w-auto">
            Clear filters
          </Link>
          <button type="submit" className="premium-primary-button w-full lg:w-auto">
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}
