import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { StaffAttendanceFilters } from "@/modules/staffboard-lite/components/attendance/staff-attendance-filters";
import { StaffAttendanceSummaryCards } from "@/modules/staffboard-lite/components/attendance/staff-attendance-summary-cards";
import { StaffAttendanceTable } from "@/modules/staffboard-lite/components/attendance/staff-attendance-table";
import { PageHeader, type RouteSearchParams } from "@/modules/staffboard-lite/components/staffboard-page-shell";
import { listStaffAttendanceForDate } from "@/modules/staffboard-lite/queries";

type StaffAttendancePageProps = {
  searchParams?: RouteSearchParams;
};

function searchParamValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmed = rawValue?.trim();
  return trimmed ? trimmed : undefined;
}

async function attendanceFilterInput(searchParams?: RouteSearchParams) {
  const params = searchParams ? await searchParams : {};
  return {
    branchId: searchParamValue(params.branchId),
    date: searchParamValue(params.date),
    staffType: searchParamValue(params.staffType),
    status: searchParamValue(params.status),
    search: searchParamValue(params.search),
    page: searchParamValue(params.page),
    pageSize: searchParamValue(params.pageSize)
  };
}

export default async function StaffAttendancePage({ searchParams }: StaffAttendancePageProps) {
  const ctx = await requireAuth();
  const filters = await attendanceFilterInput(searchParams);
  const data = await listStaffAttendanceForDate(ctx, filters);
  if (!data.selectedBranchId) {
    return <PermissionState />;
  }

  const permissions = await getEffectivePermissions({ ctx, branchId: data.selectedBranchId });
  const canCorrect = permissions.has("staffboard.attendance.correct");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description="Review daily staff check-in and check-out attendance, filter operational rows, and correct records when authorized."
      />

      <StaffAttendanceFilters
        branchOptions={data.branchOptions}
        selectedBranchId={data.selectedBranchId}
        selectedDate={data.selectedDate}
        staffType={filters.staffType}
        status={filters.status}
        search={filters.search}
      />

      <StaffAttendanceSummaryCards summary={data.summary} />

      <StaffAttendanceTable
        rows={data.rows}
        canCorrect={canCorrect}
        selectedDate={data.selectedDate}
        totalRows={data.totalRows}
        page={data.page}
        pageSize={data.pageSize}
        filterParams={{
          branchId: data.selectedBranchId,
          staffType: filters.staffType,
          status: filters.status,
          search: filters.search
        }}
      />
    </div>
  );
}
