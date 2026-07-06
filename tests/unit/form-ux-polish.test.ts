import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("form UX polish", () => {
  it("adds reusable form primitives for required fields, messages, and field errors", () => {
    const primitives = source("src/components/ui/form-primitives.tsx");
    const submitButton = source("src/components/ui/submit-button.tsx");

    expect(primitives).toContain("RequiredMark");
    expect(primitives).toContain("FieldErrorMessage");
    expect(primitives).toContain("FormMessage");
    expect(primitives).toContain("role=\"alert\"");
    expect(primitives).toContain("role=\"status\"");
    expect(submitButton).toContain("useFormStatus");
    expect(submitButton).toContain("pendingLabel");
  });

  it("shows field-level validation hooks on core edit forms", () => {
    const academiaForms = source("src/modules/academia/components/core-record-edit-forms.tsx");
    const studentRegistrationForm = source("src/modules/academia/components/student-registration-form.tsx");
    const staffForm = source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx");

    expect(studentRegistrationForm).toContain("error={admissionNumberError}");
    expect(studentRegistrationForm).toContain("error={fieldError(state, \"fullName\")}");
    expect(academiaForms).toContain("StudentRegistrationForm");
    expect(academiaForms).toContain("error={fieldError(state, \"leftOn\")}");
    expect(staffForm).toContain("error={fieldError(state, \"employeeCode\")}");
    expect(staffForm).toContain("error={fieldError(state, \"staffType\")}");
  });

  it("marks important create fields as required and adds school-friendly helper text", () => {
    const studentForm = source("src/modules/academia/components/student-registration-form.tsx");
    const staffForm = source("src/modules/staffboard-lite/components/staff-profile-create-form.tsx");
    const classPage = source("src/app/(dashboard)/academia/classes/page.tsx");

    expect(studentForm).toContain("Unique school scholar or admission number.");
    expect(staffForm).toContain("Unique staff code used by the school.");
    expect(classPage).toContain("Short code used in lists and reports.");
    expect(`${studentForm}\n${staffForm}\n${classPage}`).toContain("SubmitButton");
    expect(`${studentForm}\n${staffForm}\n${classPage}`).toContain("pendingLabel");
  });

  it("polishes attendance and QR forms with helper text and safe loading states", () => {
    const attendanceForm = source("src/modules/academia/components/attendance/attendance-mark-form.tsx");
    const qrInput = source("src/modules/staffboard-lite/components/attendance/staff-qr-manual-token-input.tsx");
    const qrPurpose = source("src/modules/staffboard-lite/components/attendance/staff-qr-purpose-select.tsx");
    const qrDisplay = source("src/modules/staffboard-lite/components/attendance/staff-qr-display.tsx");
    const qrScan = source("src/modules/staffboard-lite/components/attendance/staff-qr-scan-form.tsx");

    expect(attendanceForm).toContain("Choose the class and section for the selected academic year.");
    expect(qrInput).toContain("QR token or scanned QR payload");
    expect(qrPurpose).toContain("Choose Check-in when staff arrive and Check-out when staff leave.");
    expect(qrDisplay).toContain("Generating...");
    expect(qrScan).toContain("Submitting scan...");
    expect(`${qrInput}\n${qrPurpose}\n${qrDisplay}\n${qrScan}`).not.toMatch(/tokenHash|rawToken/);
  });

  it("keeps correction forms reason-first and audit-aware", () => {
    const correctionForm = source("src/modules/staffboard-lite/components/attendance/staff-attendance-correction-form.tsx");

    expect(correctionForm).toContain("Correction reason");
    expect(correctionForm).toContain("Write a short, verified reason.");
    expect(correctionForm).toContain("aria-invalid={Boolean(reasonError)}");
    expect(correctionForm).toContain("Corrections are audit logged");
  });

  it("keeps mobile-safe form sizing and avoids internal error/token exposure", () => {
    const combined = [
      source("src/modules/academia/components/core-record-edit-forms.tsx"),
      source("src/modules/staffboard-lite/components/staff-profile-edit-form.tsx"),
      source("src/app/(auth)/login/page.tsx")
    ].join("\n");

    expect(combined).toContain("min-h-11 w-full");
    expect(combined).toContain("sm:w-auto");
    expect(combined).not.toMatch(/Prisma|tokenHash|rawToken|actorUserId:/);
  });
});
