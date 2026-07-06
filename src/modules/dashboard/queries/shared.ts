import { forbidden } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { DASHBOARD_VIEW_PERMISSION } from "@/modules/dashboard/permissions";
import { dashboardSummaryFilterSchema } from "@/modules/dashboard/schemas";

export type DashboardQueryScope = {
  branchIds: string[];
  selectedBranchId: string | null;
  activeAcademicYearId: string | null;
  date: Date;
  dateString: string;
};

const DEFAULT_DASHBOARD_TIME_ZONE = "Asia/Kolkata";

function todayDateInTimeZone(timeZone = DEFAULT_DASHBOARD_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(valueByType.get("year"));
  const month = Number(valueByType.get("month"));
  const day = Number(valueByType.get("day"));
  return new Date(Date.UTC(year, month - 1, day));
}

export function normalizeDashboardDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function resolveDashboardScope(ctx: TenantContext, input: unknown = {}): Promise<DashboardQueryScope> {
  const params = dashboardSummaryFilterSchema.parse(input);
  if (params.branchId && !ctx.accessibleBranchIds.includes(params.branchId)) {
    throw forbidden("FORBIDDEN_DASHBOARD_BRANCH");
  }

  const branchIds = params.branchId
    ? [params.branchId]
    : ctx.activeBranchId
      ? [ctx.activeBranchId]
      : ctx.accessibleBranchIds;
  const selectedBranchId = params.branchId ?? ctx.activeBranchId ?? branchIds[0] ?? null;

  await requirePermission({
    ctx,
    permission: DASHBOARD_VIEW_PERMISSION,
    branchId: selectedBranchId
  });

  const date = normalizeDashboardDateOnly(params.date ?? todayDateInTimeZone());
  return {
    branchIds,
    selectedBranchId,
    activeAcademicYearId: ctx.activeAcademicYearId,
    date,
    dateString: toDateOnlyString(date)
  };
}

export function activeBranchFilter(scope: DashboardQueryScope) {
  return { in: scope.branchIds };
}
