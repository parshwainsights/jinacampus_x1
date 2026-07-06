import type { StaffAttendanceStatus, StaffType } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/context";
import { activeBranchFilter, resolveDashboardScope } from "./shared";

export type StaffBoardDashboardMetrics = {
  totalActiveStaff: number;
  totalTeachers: number;
  totalNonTeachingStaff: number;
  activeStaffByType: Partial<Record<StaffType, number>>;
};

export type StaffAttendanceDashboardMetrics = {
  date: string;
  checkedIn: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  notMarked: number;
  notMarkedOrAbsent: number;
};

function staffAttendanceStatusCount(
  groups: Array<{ status: StaffAttendanceStatus; _count: { _all: number } }>,
  status: StaffAttendanceStatus
) {
  return groups.find((group) => group.status === status)?._count._all ?? 0;
}

export async function getStaffBoardDashboardMetrics(
  ctx: TenantContext,
  input: unknown = {}
): Promise<StaffBoardDashboardMetrics> {
  const scope = await resolveDashboardScope(ctx, input);
  const branchFilter = activeBranchFilter(scope);

  const [totalActiveStaff, totalTeachers, totalNonTeachingStaff, staffTypeGroups] = await Promise.all([
    db.staffProfile.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        employmentStatus: "ACTIVE"
      }
    }),
    db.staffProfile.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        employmentStatus: "ACTIVE",
        staffType: "TEACHER"
      }
    }),
    db.staffProfile.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        employmentStatus: "ACTIVE",
        NOT: { staffType: "TEACHER" }
      }
    }),
    db.staffProfile.groupBy({
      by: ["staffType"],
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        employmentStatus: "ACTIVE"
      },
      _count: { _all: true }
    })
  ]);

  return {
    totalActiveStaff,
    totalTeachers,
    totalNonTeachingStaff,
    activeStaffByType: Object.fromEntries(staffTypeGroups.map((group) => [group.staffType, group._count._all]))
  };
}

export async function getStaffAttendanceDashboardMetrics(
  ctx: TenantContext,
  input: unknown = {}
): Promise<StaffAttendanceDashboardMetrics> {
  const scope = await resolveDashboardScope(ctx, input);
  const branchFilter = activeBranchFilter(scope);

  const [totalActiveStaff, checkedIn, attendanceRecordsToday, statusGroups] = await Promise.all([
    db.staffProfile.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        employmentStatus: "ACTIVE"
      }
    }),
    db.staffAttendanceRecord.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        attendanceDate: scope.date,
        checkInAt: { not: null },
        staff: {
          tenantId: ctx.tenantId,
          branchId: branchFilter,
          employmentStatus: "ACTIVE"
        }
      }
    }),
    db.staffAttendanceRecord.count({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        attendanceDate: scope.date,
        staff: {
          tenantId: ctx.tenantId,
          branchId: branchFilter,
          employmentStatus: "ACTIVE"
        }
      }
    }),
    db.staffAttendanceRecord.groupBy({
      by: ["status"],
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        attendanceDate: scope.date,
        staff: {
          tenantId: ctx.tenantId,
          branchId: branchFilter,
          employmentStatus: "ACTIVE"
        }
      },
      _count: { _all: true }
    })
  ]);

  const absent = staffAttendanceStatusCount(statusGroups, "ABSENT");
  const notMarked = Math.max(totalActiveStaff - attendanceRecordsToday, 0);

  return {
    date: scope.dateString,
    checkedIn,
    present: staffAttendanceStatusCount(statusGroups, "PRESENT"),
    late: staffAttendanceStatusCount(statusGroups, "LATE"),
    halfDay: staffAttendanceStatusCount(statusGroups, "HALF_DAY"),
    absent,
    notMarked,
    notMarkedOrAbsent: notMarked + absent
  };
}
