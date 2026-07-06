import type { StudentAttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/context";
import { activeBranchFilter, resolveDashboardScope } from "./shared";

export type StudentAttendanceDashboardMetrics = {
  date: string;
  marked: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  classesNotMarked: number;
};

function statusCount(
  groups: Array<{ status: StudentAttendanceStatus; _count: { _all: number } }>,
  status: StudentAttendanceStatus
) {
  return groups.find((group) => group.status === status)?._count._all ?? 0;
}

export async function getStudentAttendanceDashboardMetrics(
  ctx: TenantContext,
  input: unknown = {}
): Promise<StudentAttendanceDashboardMetrics> {
  const scope = await resolveDashboardScope(ctx, input);
  const branchFilter = activeBranchFilter(scope);
  if (!scope.activeAcademicYearId) {
    return {
      date: scope.dateString,
      marked: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      classesNotMarked: 0
    };
  }

  const [statusGroups, classSections] = await Promise.all([
    db.studentAttendanceRecord.groupBy({
      by: ["status"],
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        academicYearId: scope.activeAcademicYearId,
        attendanceDate: scope.date,
        sessionType: "FULL_DAY"
      },
      _count: { _all: true }
    }),
    db.classSection.findMany({
      where: {
        tenantId: ctx.tenantId,
        branchId: branchFilter,
        academicYearId: scope.activeAcademicYearId,
        status: "ACTIVE"
      },
      select: {
        id: true,
        enrollments: {
          where: {
            tenantId: ctx.tenantId,
            branchId: branchFilter,
            academicYearId: scope.activeAcademicYearId,
            status: "ACTIVE",
            enrolledOn: { lte: scope.date },
            OR: [{ leftOn: null }, { leftOn: { gte: scope.date } }],
            student: {
              tenantId: ctx.tenantId,
              branchId: branchFilter,
              status: "ACTIVE"
            }
          },
          select: { studentId: true }
        },
        studentAttendanceRecords: {
          where: {
            tenantId: ctx.tenantId,
            branchId: branchFilter,
            academicYearId: scope.activeAcademicYearId,
            attendanceDate: scope.date,
            sessionType: "FULL_DAY"
          },
          select: { studentId: true }
        }
      }
    })
  ]);

  const marked = statusGroups.reduce((total, group) => total + group._count._all, 0);
  const classesNotMarked = classSections.filter(
    (classSection) => classSection.enrollments.length > 0 && classSection.studentAttendanceRecords.length === 0
  ).length;

  return {
    date: scope.dateString,
    marked,
    present: statusCount(statusGroups, "PRESENT"),
    absent: statusCount(statusGroups, "ABSENT"),
    late: statusCount(statusGroups, "LATE"),
    halfDay: statusCount(statusGroups, "HALF_DAY"),
    classesNotMarked
  };
}
