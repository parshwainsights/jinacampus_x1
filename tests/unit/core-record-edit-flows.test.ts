import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const editRoutes = [
  "src/app/(dashboard)/academia/classes/[classId]/edit/page.tsx",
  "src/app/(dashboard)/academia/sections/[sectionId]/edit/page.tsx",
  "src/app/(dashboard)/academia/subjects/[subjectId]/edit/page.tsx",
  "src/app/(dashboard)/academia/students/[studentId]/edit/page.tsx",
  "src/app/(dashboard)/academia/guardians/[guardianId]/edit/page.tsx",
  "src/app/(dashboard)/academia/enrollments/[enrollmentId]/edit/page.tsx",
  "src/app/(dashboard)/staffboard/staff/[staffId]/edit/page.tsx"
] as const;

describe("core record edit flows", () => {
  it("creates edit routes for supported core records", () => {
    for (const route of editRoutes) {
      expect(existsSync(resolve(process.cwd(), route))).toBe(true);
    }
  });

  it("loads existing records through tenant-safe query functions", () => {
    expect(source("src/app/(dashboard)/academia/classes/[classId]/edit/page.tsx")).toContain("getClassById(ctx, classId)");
    expect(source("src/app/(dashboard)/academia/sections/[sectionId]/edit/page.tsx")).toContain("getSectionById(ctx, sectionId)");
    expect(source("src/app/(dashboard)/academia/subjects/[subjectId]/edit/page.tsx")).toContain("getSubjectById(ctx, subjectId)");
    expect(source("src/app/(dashboard)/academia/students/[studentId]/edit/page.tsx")).toContain("getStudentById(ctx, studentId)");
    expect(source("src/app/(dashboard)/academia/guardians/[guardianId]/edit/page.tsx")).toContain("getGuardianById(ctx, guardianId)");
    expect(source("src/app/(dashboard)/academia/enrollments/[enrollmentId]/edit/page.tsx")).toContain("getEnrollmentById(ctx, enrollmentId)");
    expect(source("src/app/(dashboard)/staffboard/staff/[staffId]/edit/page.tsx")).toContain("getStaffProfileById(ctx, staffId)");
  });

  it("keeps edit routes behind server-side authentication", () => {
    for (const route of editRoutes) {
      expect(source(route)).toContain("requireAuth()");
    }
  });

  it("shows safe permission states before rendering edit forms to unauthorized users", () => {
    const expectedPermissions: Record<(typeof editRoutes)[number], string> = {
      "src/app/(dashboard)/academia/classes/[classId]/edit/page.tsx": "academia.class.manage",
      "src/app/(dashboard)/academia/sections/[sectionId]/edit/page.tsx": "academia.section.manage",
      "src/app/(dashboard)/academia/subjects/[subjectId]/edit/page.tsx": "academia.subject.manage",
      "src/app/(dashboard)/academia/students/[studentId]/edit/page.tsx": "academia.student.update",
      "src/app/(dashboard)/academia/guardians/[guardianId]/edit/page.tsx": "academia.guardian.manage",
      "src/app/(dashboard)/academia/enrollments/[enrollmentId]/edit/page.tsx": "academia.enrollment.manage",
      "src/app/(dashboard)/staffboard/staff/[staffId]/edit/page.tsx": "staffboard.staff.update"
    };

    for (const route of editRoutes) {
      const routeSource = source(route);
      expect(routeSource).toContain("getEffectivePermissions");
      expect(routeSource).toContain("PermissionState");
      expect(routeSource).toContain(expectedPermissions[route]);
    }
  });

  it("renders safe not-found states for inaccessible edit records", () => {
    for (const route of editRoutes) {
      expect(source(route)).toContain("notFound()");
    }
  });

  it("wires update actions to existing audited services", () => {
    const academiaActions = source("src/modules/academia/actions/profile.actions.ts");
    const staffActions = source("src/modules/staffboard-lite/actions/staff-profile.actions.ts");

    expect(academiaActions).toContain("updateClass(ctx, input)");
    expect(academiaActions).toContain("updateSection(ctx, input)");
    expect(academiaActions).toContain("updateSubject(ctx, input)");
    expect(academiaActions).toContain("updateStudent(ctx, input)");
    expect(academiaActions).toContain("updateGuardian(ctx, input)");
    expect(academiaActions).toContain("updateEnrollment(ctx, input)");
    expect(staffActions).toContain("updateStaffProfile(ctx, input)");
  });

  it("does not accept tenant or actor identity in edit action payloads", () => {
    const actionSource = [
      source("src/modules/academia/actions/profile.actions.ts"),
      source("src/modules/staffboard-lite/actions/staff-profile.actions.ts")
    ].join("\n");

    expect(actionSource).not.toContain("tenantId:");
    expect(actionSource).not.toContain("actorUserId:");
    expect(actionSource).not.toContain("updatedById:");
  });

  it("prefills edit forms with existing values", () => {
    const academiaFormSource = source("src/modules/academia/components/core-record-edit-forms.tsx");
    const studentRegistrationFormSource = source("src/modules/academia/components/student-registration-form.tsx");
    const staffFormSource = source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx");

    expect(academiaFormSource).toContain("defaultValue={record.code}");
    expect(academiaFormSource).toContain("StudentRegistrationForm");
    expect(studentRegistrationFormSource).toContain("defaultValue={value(student, \"admissionNumber\")}");
    expect(studentRegistrationFormSource).toContain("defaultValue={resolvedFullName(student)}");
    expect(academiaFormSource).toContain("defaultValue={guardian.firstName}");
    expect(academiaFormSource).toContain("defaultValue={enrollment.rollNumber ?? \"\"}");
    expect(staffFormSource).toContain("defaultValue={staffProfile.employeeCode}");
  });

  it("adds list-page edit links only for implemented edit pages", () => {
    expect(source("src/app/(dashboard)/academia/classes/page.tsx")).toContain("/academia/classes/${academicClass.id}/edit");
    expect(source("src/app/(dashboard)/academia/sections/page.tsx")).toContain("/academia/sections/${section.id}/edit");
    expect(source("src/app/(dashboard)/academia/subjects/page.tsx")).toContain("/academia/subjects/${subject.id}/edit");
    expect(source("src/app/(dashboard)/academia/students/page.tsx")).toContain("/academia/students/${student.id}/edit");
    expect(source("src/app/(dashboard)/academia/students/page.tsx")).toContain("/academia/students/${student.id}");
    expect(source("src/app/(dashboard)/academia/guardians/page.tsx")).toContain("/academia/guardians/${guardian.id}/edit");
    expect(source("src/app/(dashboard)/academia/enrollments/page.tsx")).toContain("/academia/enrollments/${enrollment.id}/edit");
    expect(source("src/app/(dashboard)/staffboard/staff/page.tsx")).toContain("/staffboard/staff/${staff.id}/edit");
  });

  it("maps update errors to safe user-facing action states", () => {
    const actionSource = [
      source("src/modules/academia/actions/profile.actions.ts"),
      source("src/modules/staffboard-lite/actions/staff-profile.actions.ts")
    ].join("\n");

    expect(actionSource).toContain("mapActionError");
    expect(actionSource).toContain("Please check the highlighted fields and try again.");
    expect(actionSource).not.toMatch(/Prisma|tokenHash|rawToken/);
  });

  it("keeps edit forms mobile-safe with full-width controls and tappable actions", () => {
    const formSource = [
      source("src/modules/academia/components/core-record-edit-forms.tsx"),
      source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx")
    ].join("\n");

    expect(formSource).toContain("min-h-11 w-full");
    expect(formSource).toContain("sm:w-auto");
    expect(formSource).toContain("grid gap-4 md:grid-cols");
  });
});
