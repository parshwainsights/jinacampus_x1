import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("app shell context safety", () => {
  it("passes only display-safe context into the top bar", () => {
    const layout = source("src/app/(dashboard)/layout.tsx");
    const topbar = source("src/components/app-shell/topbar.tsx");

    expect(layout).toContain("topbarContext");
    expect(layout).toContain("userEmail: ctx.userEmail");
    expect(layout).toContain("hasActiveBranch: Boolean(ctx.activeBranchId)");
    expect(layout).toContain("hasActiveAcademicYear: Boolean(ctx.activeAcademicYearId)");
    expect(layout).toContain("institutionName: ctx.institutionDisplayName ?? ctx.institutionName");
    expect(layout).toContain("roleLabels: ctx.roleLabels ?? []");
    expect(layout).toContain("<Topbar context={topbarContext} branding={branding} />");
    expect(layout).not.toContain("<Topbar ctx={ctx} />");

    expect(topbar).toContain("TopbarContext");
    expect(topbar).toContain("Sign out");
    expect(topbar).toContain("/api/auth/logout");
    expect(topbar).not.toContain("TenantContext");
    expect(topbar).not.toMatch(/tenantId|activeBranchId|activeAcademicYearId|userId/);
  });

  it("keeps the auth-me route from returning raw internal context identifiers", () => {
    const route = source("src/app/api/auth/me/route.ts");

    expect(route).toContain("hasActiveBranch");
    expect(route).toContain("hasActiveAcademicYear");
    expect(route).toContain("accessibleBranchCount");
    expect(route).not.toMatch(/return NextResponse\.json\(await getTenantContext\(\)\)/);
    expect(route).not.toMatch(/tenantId:|userId:|activeBranchId:|activeAcademicYearId:|accessibleBranchIds:/);
  });

  it("keeps the campus-core context route display-safe", () => {
    const route = source("src/app/api/campus-core/context/route.ts");

    expect(route).toContain("institutionDisplayName");
    expect(route).toContain("roleLabels");
    expect(route).toContain("accessibleBranchCount");
    expect(route).not.toMatch(/tenantId:|userId:|activeBranchId:|activeAcademicYearId:|accessibleBranchIds:/);
  });

  it("keeps list-page DTOs from serializing tenant or actor internals", () => {
    const campusQueries = source("src/modules/campus-core/queries.ts");
    const classQueries = source("src/modules/academia/queries/class.queries.ts");
    const classSectionQueries = source("src/modules/academia/queries/class-section.queries.ts");
    const enrollmentQueries = source("src/modules/academia/queries/enrollment.queries.ts");
    const guardianQueries = source("src/modules/academia/queries/guardian.queries.ts");
    const studentQueries = source("src/modules/academia/queries/student.queries.ts");
    const staffQueries = source("src/modules/staffboard-lite/queries/staff-profile.queries.ts");

    expect(campusQueries).toContain("select: { id: true, name: true }");
    for (const querySource of [campusQueries, classQueries, classSectionQueries, enrollmentQueries, guardianQueries, studentQueries, staffQueries]) {
      expect(querySource).not.toContain("tenantId: true");
      expect(querySource).not.toContain("createdById: true");
      expect(querySource).not.toContain("updatedById: true");
    }
    expect(studentQueries).toContain("admissionNumber: true");
    expect(staffQueries).toContain("staffProfileListSelect");
    expect(staffQueries).not.toContain("userId: true");
  });
});
