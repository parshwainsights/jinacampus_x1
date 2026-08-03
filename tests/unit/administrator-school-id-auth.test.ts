import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    platformAdministrator: { findUnique: vi.fn(), update: vi.fn() },
    platformAdministratorSession: { create: vi.fn() }
  },
  verifyPassword: vi.fn(),
  createRawPlatformAdministratorSessionToken: vi.fn(),
  getPlatformAdministratorSessionExpiresAt: vi.fn(),
  hashPlatformAdministratorSessionToken: vi.fn(),
  setPlatformAdministratorSessionCookie: vi.fn(),
  writePlatformAuditLog: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/auth/password", () => ({ verifyPassword: mocks.verifyPassword }));
vi.mock("@/lib/auth/platform-administrator-session", () => ({
  createRawPlatformAdministratorSessionToken: mocks.createRawPlatformAdministratorSessionToken,
  getPlatformAdministratorSessionExpiresAt: mocks.getPlatformAdministratorSessionExpiresAt,
  hashPlatformAdministratorSessionToken: mocks.hashPlatformAdministratorSessionToken,
  setPlatformAdministratorSessionCookie: mocks.setPlatformAdministratorSessionCookie
}));
vi.mock("@/lib/audit/platform-audit-log", () => ({
  writePlatformAuditLog: mocks.writePlatformAuditLog
}));

import { POST } from "@/app/api/auth/administrator-login/route";
import {
  ADMINISTRATOR_LOGIN_ERROR_MESSAGE,
  validateSchoolId
} from "@/modules/campus-core/tenant-login-policy";

const platformAdministrator = {
  id: "platform-administrator-id",
  email: "operator@example.test",
  displayName: "Platform Operator",
  status: "ACTIVE",
  credential: { passwordHash: "stored-administrator-hash", mustChange: false }
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
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.platformAdministrator.findUnique.mockResolvedValue(platformAdministrator);
  mocks.db.platformAdministrator.update.mockResolvedValue({});
  mocks.db.platformAdministratorSession.create.mockResolvedValue({ id: "platform-session-id" });
  mocks.db.$transaction.mockImplementation(async (callback: (client: typeof mocks.db) => unknown) => callback(mocks.db));
  mocks.verifyPassword.mockResolvedValue(true);
  mocks.createRawPlatformAdministratorSessionToken.mockReturnValue("raw-platform-session-token");
  mocks.hashPlatformAdministratorSessionToken.mockResolvedValue("hashed-platform-session-token");
  mocks.getPlatformAdministratorSessionExpiresAt.mockReturnValue(new Date("2026-08-03T00:00:00.000Z"));
  mocks.setPlatformAdministratorSessionCookie.mockResolvedValue(undefined);
  mocks.writePlatformAuditLog.mockResolvedValue(undefined);
});

describe("independent Administrator Portal and School ID login", () => {
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

  it("logs in through the independent platform administrator table and session", async () => {
    const result = await postAdminLogin({
      email: platformAdministrator.email,
      password: "correct-password"
    });

    expect(result).toEqual({ status: 200, body: { ok: true, redirectTo: "/administrator" } });
    expect(mocks.db.platformAdministrator.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: platformAdministrator.email }
    }));
    expect(mocks.db.platformAdministratorSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        administratorId: platformAdministrator.id,
        tokenHash: "hashed-platform-session-token"
      })
    });
    expect(mocks.setPlatformAdministratorSessionCookie).toHaveBeenCalledWith(
      "raw-platform-session-token",
      expect.any(Date)
    );
    expect(JSON.stringify(result.body)).not.toMatch(/passwordHash|tokenHash|tenantId|raw-platform-session-token/i);
  });

  it("returns one safe error shape without consulting tenant users", async () => {
    mocks.db.platformAdministrator.findUnique.mockResolvedValue(null);

    const result = await postAdminLogin({
      email: "principal@example.test",
      password: "candidate-password"
    });

    expect(result).toEqual({ status: 401, body: { error: ADMINISTRATOR_LOGIN_ERROR_MESSAGE } });
    expect(JSON.stringify(result.body)).not.toMatch(/role|tenant|passwordHash|tokenHash|principal|teacher|staff/i);
  });

  it("routes temporary platform credentials through the platform password page", async () => {
    mocks.db.platformAdministrator.findUnique.mockResolvedValue({
      ...platformAdministrator,
      credential: { ...platformAdministrator.credential, mustChange: true }
    });

    const result = await postAdminLogin({
      email: platformAdministrator.email,
      password: "correct-password"
    });

    expect(result).toEqual({
      status: 200,
      body: { ok: true, redirectTo: "/administrator/account/change-password?required=1" }
    });
  });

  it("keeps school and platform authentication separate in schema, cookies, and routes", () => {
    const schema = source("prisma/schema.prisma");
    const proxy = source("proxy.ts");
    const platformSession = source("src/lib/auth/platform-administrator-session.ts");
    const loginRoute = source("src/app/api/auth/administrator-login/route.ts");

    expect(schema).toContain("model PlatformAdministrator");
    expect(schema).toContain("model PlatformAdministratorCredential");
    expect(schema).toContain("model PlatformAdministratorSession");
    expect(schema).toContain("model PlatformAuditLog");
    expect(proxy).toContain("PLATFORM_SESSION_COOKIE_NAME");
    expect(proxy).toContain("hasPlatformSession");
    expect(platformSession).toContain("PLATFORM_SESSION_HASH_DOMAIN");
    expect(loginRoute).toContain("db.platformAdministrator.findUnique");
    expect(loginRoute).not.toContain("db.user");
    expect(loginRoute).not.toContain("roleAssignments");
  });

  it("keeps the Administrator Portal limited to school registry CRUD", () => {
    const services = source("src/modules/campus-core/administrator-services.ts");
    const schoolsPage = source("src/app/administrator/schools/page.tsx");
    const schoolDetailPage = source("src/app/administrator/schools/[tenantId]/page.tsx");
    const legacyDashboardPage = source("src/app/administrator/schools/[tenantId]/dashboard/page.tsx");
    const shell = source("src/modules/campus-core/components/administrator-shell.tsx");

    expect(shell).toContain('{ href: "/administrator/schools", label: "Schools", Icon: School }');
    expect(shell).toContain('{ href: "/administrator/profile", label: "Profile", Icon: UserRound }');
    expect(schoolsPage).not.toContain("Open School Dashboard");
    expect(schoolDetailPage).not.toContain("Open School Dashboard");
    expect(legacyDashboardPage).toContain("redirect(`/administrator/schools/${tenantId}`)");
    expect(services).not.toContain("getSchoolDashboardForAdministrator");
    expect(services).not.toContain("attendanceDate: today");
  });

  it("gives atomic school provisioning a bounded Supabase-safe transaction window", () => {
    const services = source("src/modules/campus-core/administrator-services.ts");
    const roleSeedBlock = services.slice(
      services.indexOf("async function ensureDefaultRolesForTenant"),
      services.indexOf("export async function getAdministratorDashboard")
    );
    const createSchoolBlock = services.slice(
      services.indexOf("export async function createSchool"),
      services.indexOf("export async function updateSchool")
    );

    expect(roleSeedBlock).toContain("tx.role.createMany");
    expect(roleSeedBlock).toContain("tx.permission.findMany");
    expect(roleSeedBlock).toContain("tx.rolePermission.createMany");
    expect(roleSeedBlock).not.toContain("tx.permission.findUnique");
    expect(createSchoolBlock).toContain("{ maxWait: 10_000, timeout: 60_000 }");
  });

  it("permanently deletes tenant-owned data with exact confirmation and retained platform audit", () => {
    const schemas = source("src/modules/campus-core/administrator-schemas.ts");
    const services = source("src/modules/campus-core/administrator-services.ts");
    const forms = source("src/modules/campus-core/components/administrator-school-forms.tsx");

    expect(schemas).toContain('value.confirmDelete === "Delete School"');
    expect(forms).toContain("Delete School Permanently");
    expect(forms).not.toContain("Delete If Safe");
    expect(services).toContain("export async function deleteSchoolPermanently");
    expect(services).toContain("tx.studentAttendanceRecord.deleteMany");
    expect(services).toContain("tx.staffAttendanceRecord.deleteMany");
    expect(services).toContain("tx.user.deleteMany");
    expect(services).toContain("tx.tenant.delete");
    expect(services).toContain("writePlatformAuditLog");
    expect(services).not.toContain("SCHOOL_DELETE_BLOCKED_BY_DEPENDENCIES");
  });

  it("keeps login forms case-safe and hides credential internals", () => {
    expect(existsSync(resolve(process.cwd(), "src/app/administrator/login/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/app/administrator/profile/page.tsx"))).toBe(true);
    const form = source("src/components/auth/administrator-login-form.tsx");

    expect(form).toContain("submittedEmail.trim().toLowerCase()");
    expect(form).toContain("password: submittedPassword");
    expect(form).not.toMatch(/submittedPassword\.(?:trim|toLowerCase|toUpperCase)\(/);
    expect(source("src/modules/campus-core/components/administrator-school-forms.tsx")).not.toMatch(/passwordHash|tokenHash/);
  });
});
