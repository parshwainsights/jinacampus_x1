import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("profile create UI and actions", () => {
  it("wires the guided Academic Setup forms to audited Academia services", () => {
    const pageSource = source("src/app/(dashboard)/academia/setup/page.tsx");
    const formSource = source("src/modules/academia/components/academic-setup-forms.tsx");
    const actionSource = source("src/modules/academia/actions/profile.actions.ts");

    expect(pageSource).toContain("Academic Setup");
    expect(formSource).toContain("createClassAction");
    expect(formSource).toContain("createSectionAction");
    expect(formSource).toContain("createClassSectionAction");
    expect(formSource).toContain("createSubjectAction");
    expect(formSource).toContain("Create Class Section");
    expect(actionSource).toContain("createClass(ctx, input)");
    expect(actionSource).toContain("createSection(ctx, input)");
    expect(actionSource).toContain("createClassSection(ctx, input)");
    expect(actionSource).toContain("createSubject(ctx, input)");
    expect(actionSource).toContain("getTenantContext()");
  });

  it("wires student creation with branch and admission fields", () => {
    const pageSource = source("src/app/(dashboard)/academia/students/page.tsx");
    const createPageSource = source("src/app/(dashboard)/academia/students/create/page.tsx");
    const formSource = source("src/modules/academia/components/student-create-form.tsx");
    const registrationFormSource = source("src/modules/academia/components/student-registration-form.tsx");
    const actionSource = source("src/modules/academia/actions/profile.actions.ts");

    expect(pageSource).toContain("/academia/students/create");
    expect(pageSource).toContain("listStudentsWithCurrentEnrollment");
    expect(pageSource).toContain("listStudentClassSectionOptions");
    expect(pageSource).toContain("students-class-section-filter");
    expect(pageSource).toContain("No students are enrolled in this class-section yet");
    expect(createPageSource).toContain("StudentCreateForm");
    expect(formSource).toContain("StudentRegistrationForm");
    expect(registrationFormSource).toContain("createStudentAction");
    expect(registrationFormSource).toContain("name=\"branchId\"");
    expect(registrationFormSource).toContain("name=\"admissionNumber\"");
    expect(registrationFormSource).toContain("name=\"fullName\"");
    expect(registrationFormSource).toContain("name=\"aadhaarNumber\"");
    expect(registrationFormSource).toContain("name=\"primaryGuardianRelation\"");
    expect(registrationFormSource).toContain("name=\"initialClassSectionId\"");
    expect(registrationFormSource).toContain("Register Student");
    expect(registrationFormSource).toContain("error={admissionNumberError}");
    expect(actionSource).toContain("createStudentRegistration(ctx, input)");
    expect(actionSource).not.toContain("tenantId:");
  });

  it("wires staff profile creation with branch, employee code, and staff type fields", () => {
    const pageSource = source("src/app/(dashboard)/staffboard/staff/page.tsx");
    const formSource = source("src/modules/staffboard-lite/components/staff-profile-create-form.tsx");
    const actionSource = source("src/modules/staffboard-lite/actions/staff-profile.actions.ts");

    expect(pageSource).toContain("StaffProfileCreateForm");
    expect(formSource).toContain("createStaffProfileAction");
    expect(formSource).toContain("useActionState(createStaffProfileAction");
    expect(formSource).toContain("name=\"branchId\"");
    expect(formSource).toContain("name=\"employeeCode\"");
    expect(formSource).toContain("name=\"staffType\"");
    expect(formSource).toContain("name=\"createLoginAccess\"");
    expect(formSource).toContain("name=\"loginRoleCode\"");
    expect(formSource).toContain("PasswordInput");
    expect(formSource).toContain("Add Staff");
    expect(formSource).toContain("error={fieldError(state, \"employeeCode\")}");
    expect(actionSource).toContain("createStaffProfile(ctx, input)");
    expect(actionSource).not.toContain("tenantId:");
  });

  it("shows staff login access status and admin account actions on the staff edit form", () => {
    const formSource = source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx");

    expect(formSource).toContain("Login Access");
    expect(formSource).toContain("Create Login Access");
    expect(formSource).toContain("Reset Password");
    expect(formSource).toContain("Disable Login Access");
    expect(formSource).toContain("Reactivate Login Access");
    expect(formSource).toContain("createStaffLoginAccessAction");
    expect(formSource).toContain("disableStaffLoginAccessAction");
    expect(formSource).toContain("reactivateStaffLoginAccessAction");
    expect(formSource).not.toMatch(/passwordHash|tokenHash/);
  });

  it("consolidates school staff account creation under Staff Profiles", () => {
    const usersPageSource = source("src/app/(dashboard)/campus-core/users/page.tsx");

    expect(usersPageSource).toContain("Create staff and login access together");
    expect(usersPageSource).toContain("Open Staff Profiles");
    expect(usersPageSource).toContain("/staffboard/staff");
    expect(usersPageSource).not.toContain("<UserCreateForm");
  });
});
