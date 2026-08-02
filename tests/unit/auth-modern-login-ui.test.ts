import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("modern responsive authentication UI", () => {
  it("uses the approved brand lockup and a project-owned photographic background", () => {
    const brand = source("src/config/brand.ts");
    const shell = source("src/components/auth/auth-shell.tsx");

    expect(brand).toContain('authBackground: "/brand/jinacampus-auth-campus-background.png"');
    expect(existsSync(resolve(process.cwd(), "public/brand/jinacampus-auth-campus-background.png"))).toBe(true);
    expect(shell).toContain("<BrandLogo");
    expect(shell).toContain("JINACAMPUS_BRAND.assets.authBackground");
    expect(shell).toContain("data-auth-shell");
    expect(shell).toContain("min-h-dvh");
    expect(shell).toContain("overflow-x-hidden");
  });

  it("gives each authentication route an explicit visual context without merging auth contracts", () => {
    expect(source("src/app/page.tsx")).toContain('<AuthShell variant="school">');
    expect(source("src/app/t/[tenantSlug]/login/page.tsx")).toContain('<AuthShell variant="school">');
    expect(source("src/app/(auth)/attendance-login/page.tsx")).toContain('<AuthShell variant="attendance">');
    expect(source("src/app/(auth)/forgot-password/page.tsx")).toContain('<AuthShell variant="recovery">');
    expect(source("src/app/administrator/login/page.tsx")).toContain('<AuthShell variant="administrator">');

    expect(source("src/components/auth/login-form.tsx")).toContain('fetch("/api/auth/login"');
    expect(source("src/components/auth/administrator-login-form.tsx")).toContain('fetch("/api/auth/administrator-login"');
  });

  it("provides curved glass surfaces, responsive safe areas, and reduced-motion-safe entrance animation", () => {
    const globals = source("src/app/globals.css");
    const shell = source("src/components/auth/auth-shell.tsx");

    expect(globals).toContain(".auth-form-panel");
    expect(globals).toContain("border-radius: 2rem");
    expect(globals).toContain("backdrop-filter: blur(26px)");
    expect(globals).toContain("@keyframes jc-auth-background-drift");
    expect(globals).toContain("@keyframes jc-auth-panel-enter");
    expect(globals).toContain("prefers-reduced-motion: reduce");
    expect(shell).toContain("env(safe-area-inset-top)");
    expect(shell).toContain("env(safe-area-inset-bottom)");
  });

  it("renders loading states for school, tenant, attendance, recovery, and administrator routes", () => {
    for (const path of [
      "src/app/(auth)/loading.tsx",
      "src/app/administrator/login/loading.tsx",
      "src/app/t/[tenantSlug]/login/loading.tsx"
    ]) {
      expect(existsSync(resolve(process.cwd(), path))).toBe(true);
      expect(source(path)).toContain("AuthLoadingState");
    }

    const loading = source("src/components/auth/auth-loading-state.tsx");
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("auth-loading-ring");
  });

  it("keeps mobile-safe fields, accessible password visibility, safe errors, and exact passwords", () => {
    const school = source("src/components/auth/login-form.tsx");
    const administrator = source("src/components/auth/administrator-login-form.tsx");
    const passwordInput = source("src/components/forms/password-input.tsx");
    const combined = `${school}\n${administrator}`;

    expect(combined).toContain("auth-field-input");
    expect(combined).toContain("auth-action-button");
    expect(combined).toContain('autoCapitalize="none"');
    expect(combined).toContain('autoCorrect="off"');
    expect(combined).toContain("spellCheck={false}");
    expect(school).toContain('password: formData.get("password")');
    expect(administrator).toContain("password: submittedPassword");
    expect(passwordInput).toContain('type="button"');
    expect(passwordInput).toContain("aria-label={label}");
    expect(combined).not.toMatch(/passwordHash|tokenHash|sessionSecret|rawToken/);
    expect(combined).not.toContain("Sign in with Google");
  });
});
