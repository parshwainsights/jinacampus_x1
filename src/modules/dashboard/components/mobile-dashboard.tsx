import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  QrCode,
  ScrollText,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { NavigationAudience } from "@/components/app-shell/navigation";

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
import type { AdminMobileAction } from "./dashboard-state";

type MobileDashboardProps = {
  userName: string;
  audience: NavigationAudience;
  adminOperations: readonly AdminMobileAction[];
  adminTools: readonly AdminMobileAction[];
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

const adminActionIconByLabel: Record<string, ReactNode> = {
  Attendance: <ClipboardCheck className="h-5 w-5" aria-hidden="true" />,
  Users: <UsersRound className="h-5 w-5" aria-hidden="true" />,
  Branches: <Building2 className="h-5 w-5" aria-hidden="true" />,
  "Academic Years": <CalendarDays className="h-5 w-5" aria-hidden="true" />,
  Settings: <Settings className="h-5 w-5" aria-hidden="true" />,
  "Roles & Permissions": <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
  "Audit Logs": <ScrollText className="h-5 w-5" aria-hidden="true" />,
  "Tenant Settings": <Settings className="h-5 w-5" aria-hidden="true" />
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
  userName,
  audience,
  adminOperations,
  adminTools,
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
  const isAdmin = audience === "admin";
  const primaryActions = quickActions.slice(0, 4);

  return (
    <div className="space-y-5 lg:hidden" data-mobile-dashboard="true">
      <MobilePageHeader
        eyebrow={dateLabel}
        title={`Good day, ${userName}`}
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
            {isAdmin ? "Today's Operations" : "Today's primary actions"}
          </h2>
        </div>
        {isAdmin && adminOperations.length > 0 ? (
          <div className="grid gap-3">
            {adminOperations.map((action) => (
              <MobileActionCard
                key={action.href}
                href={action.href}
                title={action.label}
                description={action.description}
                icon={adminActionIconByLabel[action.label]}
                tone={action.label === "Attendance" ? "indigo" : action.label === "Settings" ? "slate" : "cyan"}
              />
            ))}
          </div>
        ) : primaryActions.length > 0 ? (
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
          {isAdmin ? "Quick Stats" : "Summary"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {isAdmin && campusCore ? (
            <>
              <MobileStatCard label="Total branches" value={campusCore.totalBranches} tone="cyan" />
              <MobileStatCard label="Total users" value={campusCore.totalUsers} tone="indigo" />
              <MobileStatCard label="Academic year" value={campusCore.activeAcademicYearName ?? "Not set"} tone={campusCore.activeAcademicYearName ? "green" : "amber"} />
              <MobileStatCard label="Active roles" value={campusCore.totalActiveRoles} tone="slate" />
            </>
          ) : null}
          {!isAdmin && studentAttendance ? (
            <>
              <MobileStatCard label="Present" value={studentAttendance.present} tone="green" />
              <MobileStatCard label="Absent" value={studentAttendance.absent} tone="red" />
              <MobileStatCard label="Late" value={studentAttendance.late} tone="amber" />
              <MobileStatCard label="Not marked" value={studentAttendance.classesNotMarked} tone="slate" />
            </>
          ) : null}
          {!isAdmin && staffAttendance ? (
            <>
              <MobileStatCard label="Staff in" value={staffAttendance.checkedIn} tone="cyan" />
              <MobileStatCard label="Staff late" value={staffAttendance.late} tone="amber" />
            </>
          ) : null}
          {!isAdmin && !studentAttendance && !staffAttendance && academia ? (
            <>
              <MobileStatCard label="Students" value={academia.totalActiveStudents} tone="indigo" />
              <MobileStatCard label="Enrollments" value={academia.totalActiveEnrollments} tone="green" />
            </>
          ) : null}
          {!isAdmin && !studentAttendance && !staffAttendance && staffBoard ? (
            <MobileStatCard label="Staff" value={staffBoard.totalActiveStaff} tone="cyan" />
          ) : null}
          {!isAdmin && !studentAttendance && !staffAttendance && campusCore ? (
            <MobileStatCard label="Branches" value={campusCore.totalBranches} tone="slate" />
          ) : null}
        </div>
      </section>

      {isAdmin && adminTools.length > 0 ? (
        <section className="space-y-3" aria-labelledby="mobile-admin-tools">
          <h2 id="mobile-admin-tools" className="text-sm font-semibold text-slate-950">Admin Tools</h2>
          <div className="grid gap-3">
            {adminTools.map((action) => (
              <MobileActionCard
                key={action.label}
                href={action.href}
                title={action.label}
                description={action.description}
                icon={adminActionIconByLabel[action.label]}
                tone="slate"
              />
            ))}
          </div>
        </section>
      ) : null}

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

      {!isAdmin && academia ? (
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

      {!isAdmin && campusCore ? (
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
