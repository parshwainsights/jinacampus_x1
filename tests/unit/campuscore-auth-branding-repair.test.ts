import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("CampusCore auth context and institution branding repair", () => {
  it("adds a POST logout route that revokes the session and clears the cookie", () => {
    const routePath = "src/app/api/auth/logout/route.ts";
    expect(existsSync(resolve(process.cwd(), routePath))).toBe(true);

    const route = source(routePath);
    expect(route).toContain("export async function POST");
    expect(route).toContain("db.session.updateMany");
    expect(route).toContain("revokedAt");
    expect(route).toContain("response.cookies.delete(env.SESSION_COOKIE_NAME)");
    expect(route).toContain("new URL(\"/login\", request.url)");
    expect(route).toContain("CAMPUS_CORE_AUDIT_EVENTS.AUTH_LOGOUT");
    expect(source("src/modules/campus-core/audit-events.ts")).toContain("campuscore.auth.logout");
    expect(route).not.toContain("passwordHash");
    expect(route).not.toMatch(/NextResponse\.json\([^)]*tokenHash/);
  });

  it("audits successful login without returning auth internals", () => {
    const route = source("src/app/api/auth/login/route.ts");
    const loginForm = source("src/components/auth/login-form.tsx");

    expect(route).toContain("CAMPUS_CORE_AUDIT_EVENTS.AUTH_LOGIN_SUCCESS");
    expect(source("src/modules/campus-core/audit-events.ts")).toContain("campuscore.auth.login_success");
    expect(route).toContain("SCHOOL_LOGIN_ERROR_MESSAGE");
    expect(source("src/modules/campus-core/tenant-login-policy.ts")).toContain("Invalid School ID, email, or password.");
    expect(source("src/components/auth/login-form.tsx")).toContain("Login failed. Please check your credentials.");
    expect(route).toContain("setSessionCookie(rawToken, expiresAt)");
    expect(route).toContain("getPostLoginRedirectPath(roleCodes)");
    expect(route).toContain("return NextResponse.json({ ok: true, redirectTo");
    expect(loginForm).toContain("result.redirectTo");
    expect(route).not.toMatch(/NextResponse\.json\([^)]*passwordHash/);
    expect(route).not.toMatch(/NextResponse\.json\([^)]*tokenHash/);
  });

  it("protects dashboard route families including Academia and account pages", () => {
    const middleware = source("middleware.ts");

    expect(middleware).toContain("\"/campus-core\"");
    expect(middleware).toContain("\"/academia\"");
    expect(middleware).toContain("\"/staffboard\"");
    expect(middleware).toContain("\"/account\"");
    expect(middleware).toContain("new URL(\"/login\", request.url)");
  });

  it("resolves tenant-scoped role labels and institution branding server-side", () => {
    const context = source("src/lib/tenant/context.ts");

    expect(context).toContain("roleAssignments");
    expect(context).toContain("assignment.tenantId === session.tenantId");
    expect(context).toContain("assignment.role.tenantId === session.tenantId");
    expect(context).toContain("institutionDisplayName");
    expect(context).toContain("institutionLogoUrl");
    expect(context).toContain("activeBranchAccess?.branch.institution");
    expect(context).not.toContain("clientRole");
    expect(context).not.toContain("clientPermission");
  });

  it("adds migration-backed institution display and logo fields", () => {
    const schema = source("prisma/schema.prisma");
    const migration = source("prisma/migrations/20260519100000_add_institution_branding/migration.sql");

    expect(schema).toContain("displayName");
    expect(schema).toContain("logoUrl");
    expect(schema).toContain("logoObjectKey");
    expect(migration).toContain("ADD COLUMN \"displayName\"");
    expect(migration).toContain("ADD COLUMN \"logoUrl\"");
    expect(migration).toContain("ADD COLUMN \"logoObjectKey\"");
  });
});
