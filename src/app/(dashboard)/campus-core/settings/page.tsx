import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import {
  getAttendanceNotificationStatus,
  getTenantSettings,
  listAttendanceSettings
} from "@/modules/campus-core/queries";
import { updateAttendanceSettingsAction, updateTenantSettingsAction } from "@/modules/campus-core/actions";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasSavedMessage(saved: string | string[] | undefined, value: "tenant" | "attendance") {
  return Array.isArray(saved) ? saved.includes(value) : saved === value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.settings.manage")) return <PermissionState />;

  const canManageNotificationSettings = permissions.has("notifications.settings.manage");
  const params = searchParams ? await searchParams : {};
  const [settings, attendanceSettings, notificationStatus] = await Promise.all([
    getTenantSettings(ctx),
    listAttendanceSettings(ctx),
    getAttendanceNotificationStatus(ctx)
  ]);
  const templateKeys = new Set(notificationStatus.templates.map((template) => template.templateKey));
  const hasStudentTemplate = templateKeys.has("student_daily_attendance_alert");
  const hasStaffTemplate = templateKeys.has("staff_monthly_attendance_summary");
  const providerStatusLabel = notificationStatus.isEnabled && notificationStatus.hasProviderIdentity
    ? notificationStatus.provider
    : "DRY_RUN / provider not configured";

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Settings</h1><p className="text-sm text-slate-500">Tenant and branch attendance defaults.</p></div>
      {hasSavedMessage(params.saved, "tenant") ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Tenant settings saved.
        </div>
      ) : null}
      {hasSavedMessage(params.saved, "attendance") ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Attendance settings saved.
        </div>
      ) : null}
      <form action={updateTenantSettingsAction} className="premium-card grid gap-3 p-5 md:grid-cols-4">
        <input name="brandName" defaultValue={settings?.brandName ?? "JinaCampus"} />
        <input name="brandByline" defaultValue={settings?.brandByline ?? "powered by Parshav Insights"} />
        <input name="timezone" defaultValue={settings?.timezone ?? "Asia/Kolkata"} />
        <button className="bg-brand-700 px-4 py-2 text-sm font-medium text-white">Save</button>
      </form>
      <section className="premium-card space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">WhatsApp notification status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Attendance notifications are limited to the approved SchoolCast Lite foundation.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider status</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{providerStatusLabel}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              DRY_RUN queues and processes messages without sending real WhatsApp messages.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live sending</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {notificationStatus.isEnabled && notificationStatus.hasProviderIdentity ? "Configured" : "Disabled"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Provider credentials and secrets are not displayed in CampusCore settings.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template mapping</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {hasStudentTemplate && hasStaffTemplate ? "Student and staff templates active" : "Template setup incomplete"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Student daily alerts and staff monthly summaries use tenant-scoped template mappings.
            </p>
          </div>
        </div>
      </section>
      <div className="space-y-4">
        {attendanceSettings.length ? (
          attendanceSettings.map((s) => (
            <form key={s.id} action={updateAttendanceSettingsAction} className="premium-card grid gap-3 p-5 md:grid-cols-6">
              <input type="hidden" name="branchId" value={s.branchId} />
              <input type="hidden" name="minimumAttendancePercentage" value={s.minimumAttendancePercentage} />
              <input type="hidden" name="staffHalfDayBeforeMinutes" value={s.staffHalfDayBeforeMinutes} />
              <input type="hidden" name="staffMinimumWorkingMinutes" value={s.staffMinimumWorkingMinutes} />
              <div className="font-medium md:col-span-6">{s.branch.name}</div>
              <label className="text-xs font-medium text-slate-600">
                Student lock time
                <input name="studentAutoLockTime" defaultValue={s.studentAutoLockTime} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Check-in start
                <input name="staffCheckInStartTime" defaultValue={s.staffCheckInStartTime} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Late after
                <input name="staffLateAfterTime" defaultValue={s.staffLateAfterTime} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                QR validity seconds
                <input name="staffQrTokenValiditySeconds" defaultValue={s.staffQrTokenValiditySeconds} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Student WhatsApp mode
                {canManageNotificationSettings ? (
                  <select name="studentAttendanceNotificationMode" defaultValue={s.studentAttendanceNotificationMode} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="DISABLED">Disabled</option>
                    <option value="EXCEPTION_ONLY">Exception only</option>
                    <option value="ALL_STATUSES">All statuses</option>
                  </select>
                ) : (
                  <>
                    <input type="hidden" name="studentAttendanceNotificationMode" value={s.studentAttendanceNotificationMode} />
                    <span className="mt-1 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      {s.studentAttendanceNotificationMode}
                    </span>
                  </>
                )}
                <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                  Exception only sends Absent, Late, Half Day, or On Leave alerts. All statuses sends a message for every marked student.
                </span>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Staff summary day
                <input name="staffMonthlySummarySendDay" defaultValue={s.staffMonthlySummarySendDay} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="studentAutoLockEnabled" defaultChecked={s.studentAutoLockEnabled} />
                Auto-lock student attendance
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="sendStudentAbsentAlert" defaultChecked={s.sendStudentAbsentAlert} />
                Legacy absence alert flag
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="sendStudentLateAlert" defaultChecked={s.sendStudentLateAlert} />
                Legacy late alert flag
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="staffQrAttendanceEnabled" defaultChecked={s.staffQrAttendanceEnabled} />
                Staff QR enabled
              </label>
              {canManageNotificationSettings ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="studentAttendanceWhatsAppEnabled" defaultChecked={s.studentAttendanceWhatsAppEnabled} />
                    Student WhatsApp alerts
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="staffMonthlySummaryWhatsAppEnabled" defaultChecked={s.staffMonthlySummaryWhatsAppEnabled} />
                    Staff monthly WhatsApp
                  </label>
                </>
              ) : (
                <>
                  <input type="hidden" name="studentAttendanceWhatsAppEnabled" value={s.studentAttendanceWhatsAppEnabled ? "on" : ""} />
                  <input type="hidden" name="staffMonthlySummaryWhatsAppEnabled" value={s.staffMonthlySummaryWhatsAppEnabled ? "on" : ""} />
                </>
              )}
              <label className="text-xs font-medium text-slate-600 md:col-span-2">
                Staff summary time
                <input name="staffMonthlySummarySendTime" defaultValue={s.staffMonthlySummarySendTime} readOnly={!canManageNotificationSettings} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <button className="bg-brand-700 px-4 py-2 text-sm font-medium text-white md:col-span-2">Save</button>
            </form>
          ))
        ) : (
          <EmptyState title="No branch attendance settings" description="Create a branch to initialize branch-level settings." />
        )}
      </div>
    </div>
  );
}
