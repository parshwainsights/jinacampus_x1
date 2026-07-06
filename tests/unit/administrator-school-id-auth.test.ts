import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    user: { findMany: vi.fn(), update: vi.fn() },
    session: { create: vi.fn() }
  },
  verifyPassword: vi.fn(),
  createRawSessionToken: vi.fn(),
  getSessionExpiresAt: vi.fn(),
  hashSessionToken: vi.fn(),
  setSessionCookie: vi.fn(),
  writeAuditLog: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/auth/password", () => ({ verifyPassword: mocks.verifyPassword }));
vi.mock("@/lib/auth/session", () => ({
  createRawSessionToken: mocks.createRawSessionToken,
  getSessionExpiresAt: mocks.getSessionExpiresAt,
  hashSessionToken: mocks.hashSessionToken
}));
vi.mock("@/lib/auth/cookies", () => ({ setSessionCookie: mocks.setSessionCookie }));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));

import { POST } from "@/app/api/auth/administrator-login/route";
import {
  ADMINISTRATOR_LOGIN_ERROR_MESSAGE,
  validateSchoolId
} from "@/modules/campus-core/tenant-login-policy";

const platformUser = {
  id: "platform-admin-user-id",
  tenantId: "platform-tenant-id",
  email: "admin@demo.jinacampus.test",
  userType: "OWNER",
  status: "ACTIVE",
  tenant: { id: "platform-tenant-id", name: "JinaCampus Platform", status: "ACTIVE" },
  passwordCredential: { passwordHash: "stored-admin-hash" },
  roleAssignments: [{ role: { code: "SUPER_ADMIN", isActive: true } }]
};

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function adminLoginRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/administrator-login", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "vitest" },
    body: JSON.stringify(body)
  });
}

async function postAdminLogin(body: Record<string, unknown>) {
  const response = await POST(adminLoginRequest(body));
  return {
    status: response.status,
    body: await response.json()
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.user.findMany.mockResolvedValue([platformUser]);
  mocks.db.user.update.mockResolvedValue({});
  mocks.db.session.create.mockResolvedValue({});
  mocks.verifyPassword.mockResolvedValue(true);
  mocks.createRawSessionToken.mockReturnValue("raw-administrator-session-token");
  mocks.hashSessionToken.mockResolvedValue("hashed-administrator-session-token");
  mocks.getSessionExpiresAt.mockReturnValue(new Date("2026-06-03T00:00:00.000Z"));
  mocks.setSessionCookie.mockResolvedValue(undefined);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("administrator portal and School ID login", () => {
  it("validates School IDs with reserved platform words blocked", () => {
    expect(validateSchoolId(" JinaCampus-Demo ")).toEqual({ ok: true, schoolId: "jinacampus-demo" });
    expect(validateSchoolId("admin")).toEqual({
      ok: false,
      message: "This School ID is reserved. Please choose another."
    });
    expect(validateSchoolId("jinacampus_demo")).toEqual({
      ok: false,
      message: "School ID can use lowercase letters, numbers, and hyphens only."
    });
  });

  it("logs in platform administrators through the administrator route only", async () => {
    const result = await postAdminLogin({
      email: "admin@demo.jinacampus.test",
      password: "correct-password"
    });

    expect(result).toEqual({ status: 200, body: { ok: true, redirectTo: "/administrator" } });
    expect(mocks.db.user.findMany.mock.calls[0][0].where.roleAssignments.some.role.code.in).toEqual(expect.arrayContaining(["SUPER_ADMIN", "ADMINISTRATOR"]));
    expect(mocks.db.session.create.mock.calls[0][0].data).toEqual(expect.objectContaining({
      tenantId: platformUser.tenantId,
      userId: platformUser.id,
      tokenHash: "hashed-administrator-session-token"
    }));
    expect(mocks.setSessionCookie).toHaveBeenCalledWith("raw-administrator-session-token", expect.any(Date));
    expect(JSON.stringify(result.body)).not.toMatch(/passwordHash|tokenHash|tenantId|raw-administrator-session-token/i);
  });

  it("returns one safe administrator error shape for invalid administrator attempts", async () => {
    mocks.db.user.findMany.mockResolvedValue([]);

    const result = await postAdminLogin({
      email: "principal@demo.jinacampus.test",
      password: "candidate-password"
    });

    expect(result).toEqual({ status: 401, body: { error: ADMINISTRATOR_LOGIN_ERROR_MESSAGE } });
    expect(JSON.stringify(result.body)).not.toMatch(/role|tenant|passwordHash|tokenHash|principal|teacher|staff/i);
  });

  it("keeps school login and administrator login separated in routes and UI", () => {
    expect(existsSync(resolve(process.cwd(), "src/app/administrator/login/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/app/api/auth/administrator-login/route.ts"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/app/api/auth/login/route.ts"))).toBe(true);

    expect(source("src/components/auth/login-form.tsx")).toContain("Administrator Login");
    expect(source("src/components/auth/login-form.tsx")).toContain("School ID");
    expect(source("src/components/auth/administrator-login-form.tsx")).toContain("JinaCampus Administrator");
    expect(source("src/components/auth/administrator-login-form.tsx")).not.toContain("School ID");
    expect(source("src/app/api/auth/login/route.ts")).toContain("SCHOOL_LOGIN_ERROR_MESSAGE");
    expect(source("src/app/api/auth/administrator-login/route.ts")).toContain("ADMINISTRATOR_LOGIN_ERROR_MESSAGE");
  });

  it("adds administrator school management routes with platform permission gates and audit events", () => {
    const services = source("src/modules/campus-core/administrator-services.ts");
    const actions = source("src/modules/campus-core/administrator-actions.ts");
    const auditEvents = source("src/modules/campus-core/audit-events.ts");
    const middleware = source("middleware.ts");

    for (const route of [
      "src/app/administrator/page.tsx",
      "src/app/administrator/schools/page.tsx",
      "src/app/administrator/schools/create/page.tsx",
      "src/app/administrator/schools/[tenantId]/page.tsx",
      "src/app/administrator/schools/[tenantId]/edit/page.tsx",
      "src/app/administrator/schools/[tenantId]/dashboard/page.tsx"
    ]) {
      expect(existsSync(resolve(process.cwd(), route))).toBe(true);
    }

    expect(services).toContain("platform.school.create");
    expect(services).toContain("platform.school.update");
    expect(services).toContain("platform.school.update_school_id");
    expect(services).toContain("platform.school.deactivate");
    expect(services).toContain("platform.school.delete");
    expect(services).toContain("SCHOOL_DELETE_BLOCKED");
    expect(services).toContain("SCHOOL_SELF_DEACTIVATE_BLOCKED");
    expect(actions).toContain("createSchoolSchema.parse");
    expect(actions).toContain("updateSchoolIdSchema.parse");
    expect(auditEvents).toContain("school.created");
    expect(auditEvents).toContain("school.school_id_updated");
    expect(auditEvents).toContain("school.deactivated");
    expect(middleware).toContain("/administrator/login");
  });

  it("adds selected-school administrator dashboard navigation without impersonation", () => {
    const shell = source("src/modules/campus-core/components/administrator-shell.tsx");
    const schoolsPage = source("src/app/administrator/schools/page.tsx");
    const schoolDetailPage = source("src/app/administrator/schools/[tenantId]/page.tsx");
    const schoolDashboardPage = source("src/app/administrator/schools/[tenantId]/dashboard/page.tsx");
    const schoolServices = source("src/modules/campus-core/administrator-services.ts");
    const appNavigation = source("src/components/app-shell/navigation.ts");
    const auditEvents = source("src/modules/campus-core/audit-events.ts");

    expect(shell).toContain('{ href: "/administrator", label: "Dashboard" }');
    expect(shell).toContain('{ href: "/administrator/schools", label: "Schools" }');
    expect(shell).toContain("activeHref");
    expect(shell).not.toContain('href="/dashboard"');
    expect(appNavigation).not.toMatch(/administrator/i);

    expect(schoolsPage).toContain("Open School Dashboard");
    expect(schoolsPage).toContain("/administrator/schools/${school.id}/dashboard");
    expect(schoolDetailPage).toContain("Open School Dashboard");
    expect(schoolDashboardPage).toContain("Administrator View");
    expect(schoolDashboardPage).toContain("You are viewing this school as Administrator.");
    expect(schoolDashboardPage).toContain("does not impersonate school users");
    expect(schoolDashboardPage).toContain("Return to Administrator Dashboard");
    expect(schoolDashboardPage).toContain("Back to Schools");
    expect(schoolDashboardPage).toContain("getSchoolDashboardForAdministrator");
    expect(schoolDashboardPage).not.toMatch(/passwordHash|tokenHash|rawToken|accessTokenEncrypted|webhookVerifyTokenHash/i);

    expect(schoolServices).toContain("export async function getSchoolDashboardForAdministrator(ctx: TenantContext, tenantId: string)");
    expect(schoolServices).toContain('await requirePlatformPermission(ctx, "platform.school.view")');
    expect(schoolServices).toContain("where: { id: tenantId }");
    expect(schoolServices).toContain("attendanceDate: today");
    expect(schoolServices).toContain("ADMINISTRATOR_SCHOOL_DASHBOARD_OPENED");
    expect(auditEvents).toContain("administrator.school_dashboard_opened");
  });

  it("labels the login identifier as School ID in customer-facing admin forms without exposing hashes", () => {
    const forms = source("src/modules/campus-core/components/administrator-school-forms.tsx");
    const pages = source("src/app/administrator/schools/page.tsx");

    expect(forms).toContain("School ID");
    expect(forms).toContain("Changing the School ID changes the login code/URL for this school.");
    expect(forms).toContain("PasswordInput");
    expect(forms).not.toMatch(/passwordHash|tokenHash/);
    expect(pages).toContain("School ID");
    expect(pages).not.toContain("Tenant Slug");
  });
});
