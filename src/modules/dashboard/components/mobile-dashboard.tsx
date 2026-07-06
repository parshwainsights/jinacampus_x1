import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  QrCode,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { MobilePageHeader } from "@/components/app-shell/mobile-page-header";
import { MobileActionCard } from "@/components/mobile/mobile-action-card";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileListCard } from "@/components/mobile/mobile-list-card";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import type {
  AcademiaDashboardMetrics,
  CampusCoreDashboardMetrics,
  StaffAttendanceDashboardMetrics,
  StaffBoardDashboardMetrics,
  StudentAttendanceDashboardMetrics,
} from "@/modules/dashboard/queries";

import type { DashboardAttentionItem } from "./dashboard-attention-panel";
import type { DashboardQuickAction } from "./dashboard-state";

type MobileDashboardProps = {
  branchLabel: string;
  dateLabel: string;
  activeAcademicYearName: string | null;
  quickActions: readonly DashboardQuickAction[];
  hasQueryFailure: boolean;
  hasActiveAcademicYear: boolean;
  hasBranchAccess: boolean;
  attentionItems: readonly DashboardAttentionItem[];
  campusCore: CampusCoreDashboardMetrics | null;
  academia: AcademiaDashboardMetrics | null;
  studentAttendance: StudentAttendanceDashboardMetrics | null;
  staffBoard: StaffBoardDashboardMetrics | null;
  staffAttendance: StaffAttendanceDashboardMetrics | null;
};

const actionIconByLabel = {
  "Manage Students": <UsersRound className="h-5 w-5" aria-hidden="true" />,
  "Mark Student Attendance": <ClipboardCheck className="h-5 w-5" aria-hidden="true" />,
  "Student Reports": <BarChart3 className="h-5 w-5" aria-hidden="true" />,
  "Generate Staff QR": <QrCode className="h-5 w-5" aria-hidden="true" />,
  "Staff Attendance": <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
  "Staff Reports": <BarChart3 className="h-5 w-5" aria-hidden="true" />,
  "Manage Staff": <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
  "Scan QR": <QrCode className="h-5 w-5" aria-hidden="true" />,
} satisfies Partial<Record<DashboardQuickAction["label"], ReactNode>>;

function actionTone(label: DashboardQuickAction["label"]): "indigo" | "cyan" | "green" | "amber" | "slate" {
  if (label.includes("QR")) return "cyan";
  if (label.includes("Attendance")) return "indigo";
  if (label.includes("Reports")) return "slate";
  return "green";
}

export function MobileDashboard({
  branchLabel,
  dateLabel,
  activeAcademicYearName,
  quickActions,
  hasQueryFailure,
  hasActiveAcademicYear,
  hasBranchAccess,
  attentionItems,
  campusCore,
  academia,
  studentAttendance,
  staffBoard,
  staffAttendance,
}: MobileDashboardProps) {
  const primaryActions = quickActions.slice(0, 4);

  return (
    <div className="space-y-5 lg:hidden" data-mobile-dashboard="true">
      <MobilePageHeader
        eyebrow={dateLabel}
        title="Good day"
        description={`${branchLabel}. ${activeAcademicYearName ?? "Academic year setup is pending."}`}
      />

      {hasQueryFailure ? (
        <MobileEmptyState
          title="Some dashboard data is unavailable"
          description="Only verified data for your current school context is shown."
        />
      ) : null}

      {!hasActiveAcademicYear ? (
        <MobileEmptyState
          title="No active academic year"
          description="Attendance and enrollment cards will stay empty until CampusCore setup is completed."
        />
      ) : null}

      {!hasBranchAccess ? (
        <MobileEmptyState
          title="No branch access"
          description="Ask an administrator to assign branch access before using branch-scoped workflows."
        />
      ) : null}

      <section className="space-y-3" aria-labelledby="mobile-primary-actions">
        <div className="flex items-center justify-between gap-3">
          <h2 id="mobile-primary-actions" className="text-sm font-semibold text-slate-950">
            {"Today's primary actions"}
          </h2>
        </div>
        {primaryActions.length > 0 ? (
          <div className="grid gap-3">
            {primaryActions.map((action) => (
              <MobileActionCard
                key={action.href}
                href={action.href}
                title={action.label}
                description={action.description}
                icon={actionIconByLabel[action.label]}
                tone={actionTone(action.label)}
              />
            ))}
          </div>
        ) : (
          <MobileEmptyState
            title="No quick actions available"
            description="Your current permissions do not include a mobile shortcut."
          />
        )}
      </section>

      <section className="space-y-3" aria-labelledby="mobile-summary">
        <h2 id="mobile-summary" className="text-sm font-semibold text-slate-950">
          Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {studentAttendance ? (
            <>
              <MobileStatCard label="Present" value={studentAttendance.present} tone="green" />
              <MobileStatCard label="Absent" value={studentAttendance.absent} tone="red" />
              <MobileStatCard label="Late" value={studentAttendance.late} tone="amber" />
              <MobileStatCard label="Not marked" value={studentAttendance.classesNotMarked} tone="slate" />
            </>
          ) : null}
          {staffAttendance ? (
            <>
              <MobileStatCard label="Staff in" value={staffAttendance.checkedIn} tone="cyan" />
              <MobileStatCard label="Staff late" value={staffAttendance.late} tone="amber" />
            </>
          ) : null}
          {!studentAttendance && !staffAttendance && academia ? (
            <>
              <MobileStatCard label="Students" value={academia.totalActiveStudents} tone="indigo" />
              <MobileStatCard label="Enrollments" value={academia.totalActiveEnrollments} tone="green" />
            </>
          ) : null}
          {!studentAttendance && !staffAttendance && staffBoard ? (
            <MobileStatCard label="Staff" value={staffBoard.totalActiveStaff} tone="cyan" />
          ) : null}
          {!studentAttendance && !staffAttendance && campusCore ? (
            <MobileStatCard label="Branches" value={campusCore.totalBranches} tone="slate" />
          ) : null}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="mobile-attention">
        <h2 id="mobile-attention" className="text-sm font-semibold text-slate-950">
          Needs attention
        </h2>
        {attentionItems.length > 0 ? (
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <MobileListCard
                key={item.label}
                title={item.label}
                subtitle={item.description}
                status={
                  <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-amber-50 px-2 text-sm font-semibold text-amber-700">
                    {item.value}
                  </span>
                }
              />
            ))}
          </div>
        ) : (
          <MobileEmptyState
            title="Nothing urgent"
            description="No attendance exceptions need immediate action in your current context."
            action={<CalendarDays className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
        )}
      </section>

      {campusCore && !campusCore.activeAcademicYearName ? (
        <MobileListCard
          title="Academic year setup"
          subtitle="Set the active academic year from CampusCore before using academic-year scoped workflows."
          status={<AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />}
          meta={[
            { label: "Users", value: campusCore.totalUsers },
            { label: "Roles", value: campusCore.totalActiveRoles },
          ]}
        />
      ) : null}

      {academia ? (
        <MobileListCard
          title="Academia readiness"
          subtitle="Current active student and class-section coverage."
          status={<GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden="true" />}
          meta={[
            { label: "Students", value: academia.totalActiveStudents },
            { label: "Class sections", value: academia.totalClassSections },
          ]}
        />
      ) : null}

      {campusCore ? (
        <MobileListCard
          title="School setup"
          subtitle={campusCore.activeAcademicYearName ?? "Active academic year is not set."}
          status={<Building2 className="h-5 w-5 text-cyan-600" aria-hidden="true" />}
          meta={[
            { label: "Branches", value: campusCore.totalBranches },
            { label: "Users", value: campusCore.totalUsers },
          ]}
        />
      ) : null}
    </div>
  );
}
