import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("UI motion and safe lifecycle governance", () => {
  it("defines subtle motion utilities with reduced-motion support", () => {
    const globals = source("src/app/globals.css");

    expect(globals).toContain("motion-fade-in");
    expect(globals).toContain("motion-slide-up");
    expect(globals).toContain("motion-soft-hover");
    expect(globals).toContain("@keyframes jc-fade-in");
    expect(globals).toContain("@keyframes jc-slide-up");
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globals).toContain("animation: none");
    expect(globals).toContain("transform: none");
  });

  it("applies motion to shared surfaces without adding animation dependencies", () => {
    const sharedSurfaces = [
      source("src/components/ui/table-primitives.tsx"),
      source("src/components/ui/empty-state.tsx"),
      source("src/modules/dashboard/components/dashboard-page-header.tsx"),
      source("src/modules/dashboard/components/dashboard-metric-card.tsx"),
      source("src/modules/dashboard/components/dashboard-quick-actions.tsx")
    ].join("\n");
    const packageJson = source("package.json");

    expect(sharedSurfaces).toContain("motion-fade-in");
    expect(sharedSurfaces).toContain("motion-slide-up");
    expect(sharedSurfaces).toContain("motion-soft-hover");
    expect(packageJson).not.toMatch(/framer-motion|react-spring|gsap/i);
  });

  it("separates user lifecycle deactivation from the normal edit form", () => {
    const userComponents = source("src/modules/campus-core/components/campus-core-profile-forms.tsx");
    const userPage = source("src/app/(dashboard)/campus-core/users/[userId]/page.tsx");

    expect(userComponents).not.toContain("edit-user-status");
    expect(userComponents).toContain("UserLifecycleActionCard");
    expect(userComponents).toContain("name=\"confirmDeactivation\"");
    expect(userComponents).toContain("Deactivate User");
    expect(userComponents).toContain("No hard delete");
    expect(userPage).toContain("campuscore.user.deactivate");
    expect(userPage).toContain("isCurrentUser={user.id === ctx.userId}");
  });

  it("keeps CampusCore user lifecycle actions permissioned, audited, and soft", () => {
    const permissions = source("src/modules/campus-core/permissions.ts");
    const roles = source("src/lib/rbac/roles.ts");
    const services = source("src/modules/campus-core/services/index.ts");
    const actions = source("src/modules/campus-core/actions.ts");

    expect(permissions).toContain("campuscore.user.deactivate");
    expect(roles).toContain("campuscore.user.deactivate");
    expect(services).toContain("deactivateUserService");
    expect(services).toContain("requirePermission({ ctx, permission: \"campuscore.user.deactivate\" })");
    expect(services).toContain("USER_SELF_DEACTIVATE_BLOCKED");
    expect(services).toContain("session.updateMany");
    expect(services).toContain("CAMPUS_CORE_AUDIT_EVENTS.USER_DEACTIVATED");
    expect(actions).toContain("deactivateUserAction");
    expect(services).not.toMatch(/user\.delete\(/);
  });

  it("exposes confirmed soft lifecycle actions for Academia and StaffBoard records", () => {
    const academiaActions = source("src/modules/academia/actions/profile.actions.ts");
    const academiaForms = source("src/modules/academia/components/core-record-edit-forms.tsx");
    const staffActions = source("src/modules/staffboard-lite/actions/staff-profile.actions.ts");
    const staffForm = source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx");

    expect(academiaActions).toContain("deactivateClassAction");
    expect(academiaActions).toContain("deactivateSectionAction");
    expect(academiaActions).toContain("deactivateSubjectAction");
    expect(academiaActions).toContain("deactivateStudentAction");
    expect(academiaActions).toContain("cancelEnrollmentAction");
    expect(academiaForms).toContain("confirmLifecycleAction");
    expect(academiaForms).toContain("No hard delete");
    expect(staffActions).toContain("deactivateStaffProfileAction");
    expect(staffForm).toContain("confirmDeactivation");
    expect(staffForm).toContain("No hard delete");
  });

  it("does not expose sensitive internals in lifecycle UI copy", () => {
    const lifecycleSource = [
      source("src/modules/campus-core/components/campus-core-profile-forms.tsx"),
      source("src/modules/academia/components/core-record-edit-forms.tsx"),
      source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx")
    ].join("\n");

    expect(lifecycleSource).not.toMatch(/passwordHash|tokenHash|rawToken|session secret|Prisma error/i);
  });
});
