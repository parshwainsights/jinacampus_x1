import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { passwordInputType, passwordToggleLabel } from "@/components/forms/password-input";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("auth password recovery and password visibility UX", () => {
  it("password input is hidden by default and has accessible toggle labels", () => {
    expect(passwordInputType(false)).toBe("password");
    expect(passwordInputType(true)).toBe("text");
    expect(passwordToggleLabel(false)).toBe("Show password");
    expect(passwordToggleLabel(true)).toBe("Hide password");
  });

  it("password input toggle is a non-submit button", () => {
    const componentSource = source("src/components/forms/password-input.tsx");

    expect(componentSource).toContain('useState(false)');
    expect(componentSource).toContain('type="button"');
    expect(componentSource).toContain("aria-label={label}");
    expect(componentSource).toContain("setIsVisible((current) => !current)");
  });

  it("login page links to forgot password and uses password visibility control", () => {
    const loginSource = source("src/app/(auth)/login/page.tsx");
    const loginFormSource = source("src/components/auth/login-form.tsx");

    expect(loginSource).toContain("<LoginForm");
    expect(loginFormSource).toContain("/forgot-password");
    expect(loginFormSource).toContain("Forgot password?");
    expect(loginFormSource).toContain("<PasswordInput");
    expect(loginFormSource).toContain("JinaCampus");
    expect(loginFormSource).toContain("The Complete School OS");
    expect(loginFormSource).toContain("powered by Parshav Insights");
    expect(loginFormSource).toContain("/brand/jinacampus-mark-transparent.png");
  });

  it("login inputs are mobile keyboard safe and only normalize School ID and email", () => {
    const loginFormSource = source("src/components/auth/login-form.tsx");

    expect(loginFormSource).toContain('autoCapitalize="none"');
    expect(loginFormSource).toContain('autoCorrect="off"');
    expect(loginFormSource).toContain("spellCheck={false}");
    expect(loginFormSource).toContain("normalizeSchoolCodeInput");
    expect(loginFormSource).toContain("normalizeEmailForSubmit");
    expect(loginFormSource).toContain("tenantSlug: normalizedTenantSlug");
    expect(loginFormSource).toContain("password: formData.get(\"password\")");
    expect(loginFormSource).toContain("Password is case-sensitive. A and a are different.");
    expect(loginFormSource).toContain(".replace(/\\s+/g, \"\")");
    expect(loginFormSource).toContain(".replace(/[^a-z0-9-]+/g, \"\")");
    expect(loginFormSource).not.toMatch(/password:\s*normalize|password:\s*String\([^)]*\)\.toLowerCase|password.*toLowerCase/i);
  });

  it("login shows a loading state and disables controls while submitting", () => {
    const loginFormSource = source("src/components/auth/login-form.tsx");

    expect(loginFormSource).toContain("LoadingSpinner");
    expect(loginFormSource).toContain("animate-spin");
    expect(loginFormSource).toContain("disabled={isSubmitting}");
    expect(loginFormSource).toContain("Signing in...");
    expect(loginFormSource).toContain("role=\"alert\"");
    expect(loginFormSource).toContain("Login failed. Please check your credentials.");
  });

  it("forgot password page renders safe public copy and no role-enumerating copy", () => {
    const forgotPasswordRoute = "src/app/(auth)/forgot-password/page.tsx";
    const pageSource = source(forgotPasswordRoute);

    expect(existsSync(resolve(process.cwd(), forgotPasswordRoute))).toBe(true);
    expect(pageSource).toContain("Forgot password?");
    expect(pageSource).toContain("requestPasswordRecoveryAction");
    expect(pageSource).toContain("Back to login");
    expect(pageSource).not.toMatch(/Email not found|User does not exist|teacher role|staff role/i);
  });

  it("password create, reset, and change forms use password visibility control", () => {
    const formSource = source("src/modules/campus-core/components/campus-core-profile-forms.tsx");

    expect(formSource).toContain("import { PasswordInput }");
    expect(formSource.match(/<PasswordInput/g)?.length).toBeGreaterThanOrEqual(6);
    expect(formSource).toContain('name="initialPassword"');
    expect(formSource).toContain('name="confirmInitialPassword"');
    expect(formSource).toContain('name="currentPassword"');
    expect(formSource).toContain('name="newPassword"');
    expect(formSource).toContain('name="confirmNewPassword"');
  });
});
