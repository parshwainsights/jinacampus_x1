import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => ({
  getTenantContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

vi.mock("@/lib/tenant/context", () => ({
  getTenantContext: mocks.getTenantContext,
  isPasswordChangeRequiredError: (error: unknown) => (
    error instanceof Error && error.message === "PASSWORD_CHANGE_REQUIRED"
  )
}));

import { requireAdministratorContext } from "@/modules/campus-core/administrator-auth";

const baseContext = {
  tenantId: "tenant-a",
  userId: "user-a",
  userEmail: "operator@example.test",
  userType: "STAFF",
  activeBranchId: null,
  accessibleBranchIds: [],
  activeAcademicYearId: null
} satisfies TenantContext;

describe("Administrator Portal authorization guard", () => {
  beforeEach(() => {
    mocks.getTenantContext.mockReset();
    mocks.redirect.mockClear();
  });

  it("allows an authenticated platform administrator", async () => {
    const context = { ...baseContext, roleCodes: ["ADMINISTRATOR"] };
    mocks.getTenantContext.mockResolvedValue(context);

    await expect(requireAdministratorContext()).resolves.toBe(context);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects a principal away from the Administrator Portal", async () => {
    mocks.getTenantContext.mockResolvedValue({
      ...baseContext,
      roleCodes: ["PRINCIPAL"]
    });

    await expect(requireAdministratorContext()).rejects.toThrow("REDIRECT:/dashboard");
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("preserves the forced-password-change redirect", async () => {
    mocks.getTenantContext.mockRejectedValue(new Error("PASSWORD_CHANGE_REQUIRED"));

    await expect(requireAdministratorContext()).rejects.toThrow(
      "REDIRECT:/account/change-password?required=1"
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/account/change-password?required=1");
  });

  it("sends unauthenticated requests to administrator login", async () => {
    mocks.getTenantContext.mockRejectedValue(new Error("UNAUTHENTICATED"));

    await expect(requireAdministratorContext()).rejects.toThrow(
      "REDIRECT:/administrator/login"
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/administrator/login");
  });
});
