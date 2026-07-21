import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getTenantContext: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: { $queryRaw: mocks.queryRaw }
}));
vi.mock("@/lib/tenant/context", () => ({
  getTenantContext: mocks.getTenantContext
}));

import { GET as getHealth } from "@/app/api/health/route";
import { GET as getEnvironmentCheck } from "@/app/api/dev/env-check/route";
import { GET as getAuthMe } from "@/app/api/auth/me/route";
import { GET as getCampusCoreContext } from "@/app/api/campus-core/context/route";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("deployment routes", () => {
  it("returns a safe connected health response", async () => {
    mocks.queryRaw.mockResolvedValue([{ connected: 1 }]);

    const response = await getHealth();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, database: "connected" });
  });

  it("returns a safe unavailable health response without leaking database errors", async () => {
    mocks.queryRaw.mockRejectedValue(Object.assign(new Error("secret database URL"), { code: "P1001" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await getHealth();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, database: "unavailable" });
    expect(JSON.stringify(body)).not.toMatch(/secret|DATABASE_URL|stack/i);
    expect(log).toHaveBeenCalledWith("Database health check failed.", { code: "P1001" });
  });

  it("returns only booleans from the development environment check", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "private-runtime-url");
    vi.stubEnv("DIRECT_URL", "private-direct-url");
    vi.stubEnv("SESSION_SECRET", "private-session-secret");
    vi.stubEnv("COMMERCIAL_BOOTSTRAP_ENABLED", "true");

    const response = await getEnvironmentCheck();
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      hasDatabaseUrl: true,
      hasDirectUrl: true,
      hasSessionSecret: true,
      commercialBootstrapEnabled: true
    });
    expect(Object.values(body).every((value) => typeof value === "boolean")).toBe(true);
    expect(JSON.stringify(body)).not.toContain("private-");
  });

  it("returns 404 for the environment check in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await getEnvironmentCheck();
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("returns safe 401 JSON for unauthenticated auth and CampusCore context", async () => {
    mocks.getTenantContext.mockRejectedValue(new Error("UNAUTHENTICATED"));

    const [meResponse, contextResponse] = await Promise.all([getAuthMe(), getCampusCoreContext()]);

    expect(meResponse.status).toBe(401);
    expect(contextResponse.status).toBe(401);
    expect(await meResponse.json()).toEqual({ error: "Please sign in to continue." });
    expect(await contextResponse.json()).toEqual({ error: "Please sign in to continue." });
  });
});
