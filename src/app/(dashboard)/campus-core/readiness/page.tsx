import Link from "next/link";

import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import type { SchoolReadinessStatus } from "@/modules/campus-core/school-readiness";
import { getSchoolReadinessReport } from "@/modules/campus-core/school-readiness.queries";

const statusStyle: Record<SchoolReadinessStatus, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  blocked: "border-red-200 bg-red-50 text-red-800"
};

export default async function SchoolReadinessPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.settings.manage")) {
    return <PermissionState title="School readiness unavailable" />;
  }

  const report = await getSchoolReadinessReport(ctx);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-700">Pre-deployment gate</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">School Readiness</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Tenant-scoped checks for access governance, attendance operations, onboarding, and passkey deployment.
        </p>
      </header>

      <section className={`border px-4 py-4 ${statusStyle[report.status]}`} aria-label="Overall readiness">
        <p className="text-xs font-semibold uppercase">Overall status</p>
        <p className="mt-1 text-lg font-semibold">
          {report.status === "ready"
            ? "Ready for controlled pilot QA"
            : report.status === "warning"
              ? "Ready with follow-up warnings"
              : "Setup blockers remain"}
        </p>
        <p className="mt-1 text-sm">
          {report.blockedCount} blocked, {report.warningCount} warning.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {report.checks.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[item.status]}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            <Link
              href={item.actionHref}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 transition hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {item.actionLabel}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
