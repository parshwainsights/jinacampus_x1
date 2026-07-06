import Link from "next/link";
import { forbidden } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/require-auth";
import { StaffAttendanceReportFilters } from "@/modules/staffboard-lite/components/attendance/staff-attendance-report-filters";
import {
  StaffCorrectionReportTable,
  StaffMonthlySummaryTable,
  NamedStaffAttendanceRowsTable
} from "@/modules/staffboard-lite/components/attendance/staff-attendance-report-tables";
import {
  currentIndiaMonthYear,
  monthStartIndiaDateString,
  todayIndiaDateString
} from "@/modules/staffboard-lite/components/attendance/staff-attendance-report-state";
import { PageHeader, type RouteSearchParams } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { getStaffAttendanceReportsPageData } from "@/modules/staffboard-lite/queries";
import { staffboardRoutes } from "@/modules/staffboard-lite/ui-config";

type StaffAttendanceReportsPageProps = {
  searchParams?: RouteSearchParams;
};

function searchParamValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmed = rawValue?.trim();
  return trimmed ? trimmed : undefined;
}

async function reportFilters(searchParams?: RouteSearchParams) {
  const params = searchParams ? await searchParams : {};
  const currentMonthYear = currentIndiaMonthYear();
  return {
    branchId: searchParamValue(params.branchId),
    date: searchParamValue(params.date) ?? todayIndiaDateString(),
    fromDate: searchParamValue(params.fromDate) ?? monthStartIndiaDateString(),
    toDate: searchParamValue(params.toDate) ?? todayIndiaDateString(),
    staffType: searchParamValue(params.staffType),
    status: searchParamValue(params.status),
    department: searchParamValue(params.department),
    search: searchParamValue(params.search),
    month: searchParamValue(params.month) ?? String(currentMonthYear.month),
    year: searchParamValue(params.year) ?? String(currentMonthYear.year),
    page: searchParamValue(params.page),
    pageSize: searchParamValue(params.pageSize)
  };
}

export default async function StaffAttendanceReportsPage({ searchParams }: StaffAttendanceReportsPageProps) {
  const ctx = await requireAuth();
  const filters = await reportFilters(searchParams);
  const data = await getStaffAttendanceReportsPageData(ctx, filters);
  if (!data.selectedBranchId) {
    throw forbidden("FORBIDDEN_STAFF_ATTENDANCE_REPORT_ACCESS");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Staff Attendance Reports"
          description="Review staff attendance, late arrivals, half-days, monthly summaries, and manual corrections."
        />
        <Link
          href={staffboardRoutes.attendance}
          className="premium-secondary-button w-full sm:w-auto premium-focus"
        >
          Daily Attendance
        </Link>
      </div>

      <StaffAttendanceReportFilters
        branchOptions={data.branchOptions}
        selectedBranchId={data.selectedBranchId}
        date={filters.date}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        staffType={filters.staffType}
        status={filters.status}
        department={filters.department}
        search={filters.search}
        month={Number(filters.month)}
        year={Number(filters.year)}
      />

      <NamedStaffAttendanceRowsTable
        title="Daily Staff Attendance"
        description="Staff attendance records for the selected report date."
        emptyTitle="No daily staff attendance records"
        emptyDescription="Check-in, check-out, and manual attendance records for the selected date will appear here."
        rows={data.dailyRows}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <NamedStaffAttendanceRowsTable
          title="Teacher Attendance Report"
          description="Date-range attendance records for teaching staff only."
          emptyTitle="No teacher attendance records"
          emptyDescription="Teacher attendance records for the selected date range will appear here."
          rows={data.teacherRows}
        />

        <NamedStaffAttendanceRowsTable
          title="Non-teaching Staff Attendance Report"
          description="Date-range attendance records for admin, accountant, driver, helper, security, and other non-teaching staff."
          emptyTitle="No non-teaching staff attendance records"
          emptyDescription="Non-teaching staff records for the selected date range will appear here."
          rows={data.nonTeachingRows}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <NamedStaffAttendanceRowsTable
          title="Late Arrival Report"
          description="Staff attendance records marked LATE for the selected date range."
          emptyTitle="No late arrivals"
          emptyDescription="Late staff attendance records for the selected filters will appear here."
          rows={data.lateRows}
        />

        <NamedStaffAttendanceRowsTable
          title="Half-day Report"
          description="Staff attendance records marked HALF_DAY for the selected date range."
          emptyTitle="No half-day records"
          emptyDescription="Half-day staff attendance records for the selected filters will appear here."
          rows={data.halfDayRows}
        />
      </div>

      <StaffMonthlySummaryTable rows={data.monthlyRows} />

      <StaffCorrectionReportTable rows={data.correctionRows} />
    </div>
  );
}
