import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getTenantContext({ allowPasswordChangeRequired: true });
    return NextResponse.json({
      userEmail: ctx.userEmail,
      institutionDisplayName: ctx.institutionDisplayName ?? ctx.institutionName ?? "JinaCampus",
      activeBranchName: ctx.activeBranchName ?? null,
      activeAcademicYearName: ctx.activeAcademicYearName ?? null,
      roleLabels: ctx.roleLabels ?? [],
      hasActiveBranch: Boolean(ctx.activeBranchId),
      hasActiveAcademicYear: Boolean(ctx.activeAcademicYearId),
      accessibleBranchCount: ctx.accessibleBranchIds.length,
      passwordChangeRequired: Boolean(ctx.passwordChangeRequired)
    });
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
}
