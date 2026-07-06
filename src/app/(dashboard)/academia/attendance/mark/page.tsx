import Link from "next/link";
import { forbidden } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { AttendanceMarkForm } from "@/modules/academia/components/attendance/attendance-mark-form";
import { PageHeader } from "@/modules/academia/components/academia-page-shell";
import { listClassSectionsForAttendance } from "@/modules/academia/queries";
import { academiaAttendanceRoutes } from "@/modules/academia/ui-config";

function indiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export default async function MarkStudentAttendancePage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({
    ctx,
    branchId: ctx.activeBranchId,
    academicYearId: ctx.activeAcademicYearId
  });

  if (!permissions.has("academia.attendance.view") || !permissions.has("academia.attendance.mark")) {
    throw forbidden("FORBIDDEN_ATTENDANCE_MARK_ACCESS");
  }

  const classSections = await listClassSectionsForAttendance(ctx);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Mark Student Attendance"
          description="Select a class-section and date, load active enrolled students, then submit full-day attendance."
        />
        <Link
          href={academiaAttendanceRoutes.overview}
          className="premium-secondary-button w-full sm:w-auto premium-focus"
        >
          Attendance Overview
        </Link>
      </div>

      <AttendanceMarkForm classSections={classSections} defaultDate={indiaDateString()} />
    </div>
  );
}
