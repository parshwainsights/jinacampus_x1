import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("mobile browser QA pass", () => {
  it("documents the approved no-new-browser-framework QA approach", () => {
    const doc = readProjectFile("docs/mobile-qa-checklist.md");
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    expect(doc).toContain("Playwright is not installed");
    expect(doc).toContain("Playwright was not added");
    expect(doc).toContain("Chrome DevTools Protocol smoke check");
    expect(doc).toContain("100 route/viewport combinations");
    expect(dependencies).not.toHaveProperty("@playwright/test");
    expect(dependencies).not.toHaveProperty("playwright");
  });

  it("covers the required mobile viewport matrix and route set", () => {
    const doc = readProjectFile("docs/mobile-qa-checklist.md");

    for (const viewport of ["360 x 800", "390 x 844", "414 x 896", "768 x 1024", "1280 x 800"]) {
      expect(doc).toContain(viewport);
    }

    for (const route of [
      "/login",
      "/dashboard",
      "/academia/attendance/mark",
      "/academia/attendance/reports",
      "/staffboard/attendance",
      "/staffboard/attendance/qr",
      "/staffboard/attendance/scan",
      "/staffboard/attendance/reports"
    ]) {
      expect(doc).toContain(route);
    }
  });

  it("records unauthenticated and authenticated browser smoke results honestly", () => {
    const doc = readProjectFile("docs/mobile-qa-checklist.md");

    expect(doc).toContain("no horizontal page overflow");
    expect(doc).toContain("no protected-route redirect failures");
    expect(doc).toContain("localhost:55432");
    expect(doc).toContain("Authenticated QA Pass - 2026-05-11");
    expect(doc).toContain("Checked 60 authenticated route/viewport combinations");
    expect(doc).toContain("No horizontal overflow failures");
    expect(doc).toContain("No framework error overlays after the staff reports fix");
  });

  it("tracks priority mobile attendance flows and deferred scope", () => {
    const doc = readProjectFile("docs/mobile-qa-checklist.md");

    expect(doc).toContain("Student Attendance Marking");
    expect(doc).toContain("Staff QR Scan");
    expect(doc).toContain("Staff QR Display");
    expect(doc).toContain("Staff Attendance Admin");
    expect(doc).toContain("full student-row workflow could not be tested");
    expect(doc).toContain("successful staff self-scan workflows");
    expect(doc).toContain("Phase 10.5 adds browser-based camera scanning");
    expect(doc).toContain("Android Chrome real-device QR scan");
    expect(doc).toContain("iOS Safari real-device QR scan");
    expect(doc).toContain("Native mobile app");
    expect(doc).toContain("Offline/PWA service worker");
    expect(doc).not.toMatch(/tokenHash|rawToken/);
  });

  it("keeps login mobile width constrained and form controls shrinkable", () => {
    const loginSource = readProjectFile("src/app/(auth)/login/page.tsx");
    const loginFormSource = readProjectFile("src/components/auth/login-form.tsx");
    const globalsSource = readProjectFile("src/app/globals.css");

    expect(loginSource).toContain("overflow-x-hidden");
    expect(loginFormSource).toContain("w-[calc(100vw-2rem)]");
    expect(loginFormSource).toContain("break-words");
    expect(globalsSource).toContain("min-w-0 max-w-full");
  });
});
