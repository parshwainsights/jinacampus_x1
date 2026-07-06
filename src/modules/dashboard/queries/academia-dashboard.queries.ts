import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/context";
import { activeBranchFilter, resolveDashboardScope } from "./shared";

export type AcademiaDashboardMetrics = {
  totalActiveStudents: number;
  totalActiveEnrollments: number;
  totalClasses: number;
  totalClassSections: number;
  totalGuardians: number;
};

export async function getAcademiaDashboardMetrics(
  ctx: TenantContext,
  input: unknown = {}
): Promise<AcademiaDashboardMetrics> {
  const scope = await resolveDashboardScope(ctx, input);
  const branchFilter = activeBranchFilter(scope);

  const [totalActiveStudents, totalActiveEnrollments, totalClasses, totalClassSections, totalGuardians] =
    await Promise.all([
      db.student.count({
        where: {
          tenantId: ctx.tenantId,
          branchId: branchFilter,
          status: "ACTIVE"
        }
      }),
      scope.activeAcademicYearId
        ? db.enrollment.count({
            where: {
              tenantId: ctx.tenantId,
              branchId: branchFilter,
              academicYearId: scope.activeAcademicYearId,
              status: "ACTIVE"
            }
          })
        : Promise.resolve(0),
      db.class.count({
        where: {
          tenantId: ctx.tenantId,
          status: "ACTIVE"
        }
      }),
      scope.activeAcademicYearId
        ? db.classSection.count({
            where: {
              tenantId: ctx.tenantId,
              branchId: branchFilter,
              academicYearId: scope.activeAcademicYearId,
              status: "ACTIVE"
            }
          })
        : Promise.resolve(0),
      db.guardian.count({
        where: {
          tenantId: ctx.tenantId,
          studentLinks: {
            some: {
              student: {
                tenantId: ctx.tenantId,
                branchId: branchFilter,
                status: "ACTIVE"
              }
            }
          }
        }
      })
    ]);

  return {
    totalActiveStudents,
    totalActiveEnrollments,
    totalClasses,
    totalClassSections,
    totalGuardians
  };
}
