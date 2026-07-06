import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  maskAadhaarNumber,
  maskBankAccountNumber
} from "@/modules/academia/schemas/student.schema";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("student registration admission-sheet upgrade", () => {
  it("masks Aadhaar and bank account values before storage", () => {
    expect(maskAadhaarNumber("1234 5678 9012")).toBe("XXXX-XXXX-9012");
    expect(maskBankAccountNumber("987654321098")).toBe("XXXXXX1098");
  });

  it("renders required admission-sheet sections and sensitive field guidance", () => {
    const form = source("src/modules/academia/components/student-registration-form.tsx");

    expect(form).toContain("Admission Details");
    expect(form).toContain("Student Personal Details");
    expect(form).toContain("Parent / Guardian Details");
    expect(form).toContain("Identity Documents");
    expect(form).toContain("Social / Demographic");
    expect(form).toContain("Address Details");
    expect(form).toContain("Bank Details");
    expect(form).toContain("System Details");
    expect(form).toContain("Full Aadhaar is not stored.");
    expect(form).toContain("Full account number is converted to a masked value.");
  });

  it("keeps list and profile pages from rendering full sensitive values", () => {
    const list = source("src/app/(dashboard)/academia/students/page.tsx");
    const profile = source("src/app/(dashboard)/academia/students/[studentId]/page.tsx");

    expect(list).not.toMatch(/aadhaarNumber|bankAccountNumber|aadhaarLast4|bankAccountLast4/);
    expect(profile).toContain("aadhaarMasked");
    expect(profile).toContain("bankAccountMasked");
    expect(profile).not.toMatch(/aadhaarNumber|bankAccountNumber/);
  });
});
