import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  LayoutList,
  ListX,
  LogIn,
  ShieldCheck,
  UserRoundCheck,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import {
  DashboardAttentionPanel,
  DashboardEmptyState,
  DashboardMetricGroup,
  DashboardMetricCard,
  DashboardPageHeader,
  DashboardQuickActions,
  DashboardSection,
  canViewDashboard,
  canViewDashboardSection,
  formatDashboardDate,
  getVisibleDashboardQuickActions,
  type DashboardAttentionItem
} from "@/modules/dashboard/components";
import {
  getAcademiaDashboardMetrics,
  getCampusCoreDashboardMetrics,
  getStaffAttendanceDashboardMetrics,
  getStaffBoardDashboardMetrics,
  getStudentAttendanceDashboardMetrics,
  type AcademiaDashboardMetrics,
  type CampusCoreDashboardMetrics,
  type StaffAttendanceDashboardMetrics,
  type StaffBoardDashboardMetrics,
  type StudentAttendanceDashboardMetrics
} from "@/modules/dashboard/queries";
import { MobileDashboard } from "@/modules/dashboard/components/mobile-dashboard";

async function safeLoad<T>(enabled: boolean, load: () => Promise<T>): Promise<PromiseSettledResult<T | null>> {
  if (!enabled) return { status: "fulfilled", value: null };
  try {
    return { status: "fulfilled", value: await load() };
  } catch (reason) {
    return { status: "rejected", reason };
  }
}

function settledValue<T>(result: PromiseSettledResult<T | null>) {
  return result.status === "fulfilled" ? result.value : null;
}

function branchContextLabel(ctx: TenantContext) {
  if (ctx.activeBranchId) return "Current branch";
  if (ctx.accessibleBranchIds.length > 0) return `${ctx.accessibleBranchIds.length} accessible branches`;
  return "No branch access";
}

function hasQueryFailure(results: readonly PromiseSettledResult<unknown>[]) {
  return results.some((result) => result.status === "rejected");
}

function buildAttendanceAttentionItems(
  studentAttendance: StudentAttendanceDashboardMetrics | null,
  staffAttendance: StaffAttendanceDashboardMetrics | null
) {
  const items: DashboardAttentionItem[] = [];

  if (studentAttendance && studentAttendance.absent > 0) {
    items.push({
      label: "Absent students",
      value: studentAttendance.absent,
      description: "Review the absent list and follow the school communication process.",
      tone: "rose"
    });
  }

  if (studentAttendance && studentAttendance.classesNotMarked > 0) {
    items.push({
      label: "Classes not marked",
      value: studentAttendance.classesNotMarked,
      description: "Some class-sections still need today's attendance.",
      tone: "amber"
    });
  }

  if (studentAttendance && studentAttendance.late > 0) {
    items.push({
      label: "Late students",
      value: studentAttendance.late,
      description: "Late arrivals are counted from existing attendance records.",
      tone: "amber"
    });
  }

  if (staffAttendance && staffAttendance.late > 0) {
    items.push({
      label: "Late staff",
      value: staffAttendance.late,
      description: "Check late arrivals in StaffBoard attendance if follow-up is needed.",
      tone: "amber"
    });
  }

  if (staffAttendance && staffAttendance.notMarked > 0) {
    items.push({
      label: "Staff not marked",
      value: staffAttendance.notMarked,
      description: "Active staff without a record are shown separately, not inferred as absent.",
      tone: "slate"
    });
  }

  if (staffAttendance && staffAttendance.halfDay > 0) {
    items.push({
      label: "Staff half day",
      value: staffAttendance.halfDay,
      description: "Half-day records may need admin review depending on school policy.",
      tone: "sky"
    });
  }

  return items;
}

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  const dateLabel = formatDashboardDate(new Date());
  const branchLabel = branchContextLabel(ctx);

  if (!canViewDashboard(permissions)) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader activeAcademicYearName={null} branchLabel={branchLabel} dateLabel={dateLabel} />
        <PermissionState
          title="Dashboard unavailable"
          description="Your account does not have permission to view dashboard metrics."
        />
      </div>
    );
  }

  const access = {
    campusCore: canViewDashboardSection(permissions, "campusCore"),
    academia: canViewDashboardSection(permissions, "academia"),
    studentAttendance: canViewDashboardSection(permissions, "studentAttendance"),
    staffBoard: canViewDashboardSection(permissions, "staffBoard"),
    staffAttendance: canViewDashboardSection(permissions, "staffAttendance")
  };

  const [campusCoreResult, academiaResult, studentAttendanceResult, staffBoardResult, staffAttendanceResult] =
    await Promise.all([
      safeLoad(access.campusCore, () => getCampusCoreDashboardMetrics(ctx)),
      safeLoad(access.academia, () => getAcademiaDashboardMetrics(ctx)),
      safeLoad(access.studentAttendance, () => getStudentAttendanceDashboardMetrics(ctx)),
      safeLoad(access.staffBoard, () => getStaffBoardDashboardMetrics(ctx)),
      safeLoad(access.staffAttendance, () => getStaffAttendanceDashboardMetrics(ctx))
    ]);

  const results = [campusCoreResult, academiaResult, studentAttendanceResult, staffBoardResult, staffAttendanceResult];
  const campusCore = settledValue<CampusCoreDashboardMetrics>(campusCoreResult);
  const academia = settledValue<AcademiaDashboardMetrics>(academiaResult);
  const studentAttendance = settledValue<StudentAttendanceDashboardMetrics>(studentAttendanceResult);
  const staffBoard = settledValue<StaffBoardDashboardMetrics>(staffBoardResult);
  const staffAttendance = settledValue<StaffAttendanceDashboardMetrics>(staffAttendanceResult);
  const quickActions = getVisibleDashboardQuickActions(permissions);
  const resolvedDateLabel = formatDashboardDate(studentAttendance?.date ?? staffAttendance?.date ?? new Date());
  const attentionItems = buildAttendanceAttentionItems(studentAttendance, staffAttendance);
  const queryFailure = hasQueryFailure(results);

  return (
    <div className="space-y-6">
      <MobileDashboard
        activeAcademicYearName={campusCore?.activeAcademicYearName ?? null}
        branchLabel={branchLabel}
        campusCore={campusCore}
        academia={academia}
        studentAttendance={studentAttendance}
        staffBoard={staffBoard}
        staffAttendance={staffAttendance}
        dateLabel={resolvedDateLabel}
        hasActiveAcademicYear={Boolean(ctx.activeAcademicYearId)}
        hasBranchAccess={ctx.accessibleBranchIds.length > 0}
        hasQueryFailure={queryFailure}
        attentionItems={attentionItems}
        quickActions={quickActions}
      />

      <div className="hidden space-y-6 lg:block" data-desktop-dashboard="true">
        <DashboardPageHeader
          activeAcademicYearName={campusCore?.activeAcademicYearName ?? null}
          branchLabel={branchLabel}
          dateLabel={resolvedDateLabel}
        />

        {queryFailure ? (
          <DashboardEmptyState
            title="Dashboard data unavailable"
            description="Some dashboard cards could not be loaded. No cross-tenant or unverified data is shown."
          />
        ) : null}

        {!ctx.activeAcademicYearId ? (
          <DashboardEmptyState
            title="No active academic year"
            description="Academic-year scoped attendance and enrollment metrics will stay empty until CampusCore setup has an active academic year."
          />
        ) : null}

        {ctx.accessibleBranchIds.length === 0 ? (
          <DashboardEmptyState
            title="No branch context"
            description="Branch-scoped cards will remain empty until this user receives branch access."
          />
        ) : null}

        {studentAttendance || staffAttendance ? (
          <DashboardSection title="Today's Attendance" description="The first place to check what is happening across students and staff today.">
            <DashboardAttentionPanel items={attentionItems} />
            {studentAttendance ? (
              <DashboardMetricGroup
                title="Student Attendance"
                description="Daily full-day class-section attendance from existing records only."
                columnsClassName="xl:grid-cols-5"
              >
                <DashboardMetricCard label="Students Marked Today" value={studentAttendance.marked} icon={ClipboardCheck} />
                <DashboardMetricCard label="Present" value={studentAttendance.present} icon={CheckCircle2} tone="emerald" />
                <DashboardMetricCard
                  label="Absent"
                  value={studentAttendance.absent}
                  icon={AlertTriangle}
                  tone="rose"
                  emphasis={studentAttendance.absent > 0 ? "attention" : "normal"}
                />
                <DashboardMetricCard
                  label="Late"
                  value={studentAttendance.late}
                  icon={Clock3}
                  tone="amber"
                  emphasis={studentAttendance.late > 0 ? "attention" : "normal"}
                />
                <DashboardMetricCard
                  label="Classes Not Marked"
                  value={studentAttendance.classesNotMarked}
                  icon={ListX}
                  tone="amber"
                  emphasis={studentAttendance.classesNotMarked > 0 ? "attention" : "normal"}
                />
              </DashboardMetricGroup>
            ) : null}
            {studentAttendance && studentAttendance.marked === 0 ? (
              <DashboardEmptyState
                title="Attendance has not been marked yet today."
                description="Use Mark Student Attendance when the selected class-section is ready. Missing student records are not counted as absent."
              />
            ) : null}
            {staffAttendance ? (
              <DashboardMetricGroup
                title="Staff Attendance"
                description="QR check-in/check-out status from existing staff attendance records."
                columnsClassName="xl:grid-cols-5"
              >
                <DashboardMetricCard label="Staff Checked In" value={staffAttendance.checkedIn} icon={LogIn} />
                <DashboardMetricCard label="Present" value={staffAttendance.present} icon={CheckCircle2} tone="emerald" />
                <DashboardMetricCard
                  label="Late"
                  value={staffAttendance.late}
                  icon={Clock3}
                  tone="amber"
                  emphasis={staffAttendance.late > 0 ? "attention" : "normal"}
                />
                <DashboardMetricCard label="Half Day" value={staffAttendance.halfDay} icon={CalendarCheck2} tone="sky" />
                <DashboardMetricCard
                  label="Not Marked"
                  value={staffAttendance.notMarked}
                  icon={ListX}
                  tone="slate"
                  emphasis={staffAttendance.notMarked > 0 ? "attention" : "normal"}
                />
              </DashboardMetricGroup>
            ) : null}
            {staffAttendance && staffAttendance.checkedIn === 0 ? (
              <DashboardEmptyState
                title="No staff check-ins recorded yet today."
                description="Staff attendance cards use QR records only. Missing staff records stay separate as not marked when active staff exists."
              />
            ) : null}
          </DashboardSection>
        ) : null}

        {academia ? (
          <DashboardSection title="Academics" description="Student records, enrollments, and academic setup readiness.">
            <DashboardMetricGroup
              title="Academia Summary"
              description="Core academic records for the active branch and academic year scope."
              columnsClassName="xl:grid-cols-5"
            >
              <DashboardMetricCard label="Active Students" value={academia.totalActiveStudents} icon={GraduationCap} />
              <DashboardMetricCard label="Active Enrollments" value={academia.totalActiveEnrollments} icon={UserRoundCheck} tone="emerald" />
              <DashboardMetricCard label="Classes" value={academia.totalClasses} icon={BookOpen} tone="sky" />
              <DashboardMetricCard label="Class Sections" value={academia.totalClassSections} icon={LayoutList} tone="slate" />
              <DashboardMetricCard label="Guardians" value={academia.totalGuardians} icon={UsersRound} tone="amber" />
            </DashboardMetricGroup>
          </DashboardSection>
        ) : null}

        {staffBoard ? (
          <DashboardSection title="StaffBoard Lite" description="Active staff profile coverage across teaching and non-teaching categories.">
            <DashboardMetricGroup
              title="StaffBoard Summary"
              description="Staff profile coverage that supports QR attendance, correction, and reports."
              columnsClassName="xl:grid-cols-3"
            >
              <DashboardMetricCard label="Active Staff" value={staffBoard.totalActiveStaff} icon={BriefcaseBusiness} />
              <DashboardMetricCard label="Teachers" value={staffBoard.totalTeachers} icon={GraduationCap} tone="emerald" />
              <DashboardMetricCard label="Non-teaching Staff" value={staffBoard.totalNonTeachingStaff} icon={UserRoundCog} tone="sky" />
            </DashboardMetricGroup>
            {staffBoard.totalActiveStaff === 0 ? (
              <DashboardEmptyState
                title="No active staff profiles"
                description="StaffBoard cards will populate after active staff profiles are added for the current branch scope."
              />
            ) : null}
          </DashboardSection>
        ) : null}

        {campusCore ? (
          <DashboardSection title="School Setup" description="Platform setup and tenant administration at a glance.">
            <DashboardMetricGroup
              title="CampusCore Summary"
              description="Branch, user, role, and active academic-year setup."
              columnsClassName="xl:grid-cols-4"
            >
              <DashboardMetricCard label="Branches" value={campusCore.totalBranches} icon={Building2} />
              <DashboardMetricCard
                label="Active Academic Year"
                value={campusCore.activeAcademicYearName ?? "Not set"}
                icon={CalendarDays}
                tone={campusCore.activeAcademicYearName ? "emerald" : "amber"}
              />
              <DashboardMetricCard label="Users" value={campusCore.totalUsers} icon={UsersRound} tone="sky" />
              <DashboardMetricCard label="Roles" value={campusCore.totalActiveRoles} icon={ShieldCheck} tone="slate" />
            </DashboardMetricGroup>
          </DashboardSection>
        ) : null}

        <DashboardSection title="Quick Actions" description="Shortcuts to already available operational routes.">
          <DashboardQuickActions actions={quickActions} />
        </DashboardSection>
      </div>
    </div>
  );
}
