import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { STUDENT_IMPORT_COLUMNS } from "@/modules/academia/student-bulk-columns";
import {
  buildStudentExportWorkbook,
  buildStudentImportTemplate,
  parseStudentImportFile
} from "@/modules/academia/services/student-bulk-workbook.service";
import { classSectionAliases } from "@/modules/academia/services/student-bulk.service";

const branchId = "00000000-0000-0000-0000-000000000003";

function csvFile(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    admissionNumber: "ADM-1001",
    admissionDate: "2026-04-01",
    fullName: "Aarav Shah",
    dateOfBirth: "2018-01-10",
    gender: "MALE",
    fatherName: "Nilesh Shah",
    motherName: "Kavita Shah",
    guardianRelation: "FATHER",
    guardianPhone: "9876543210",
    aadhaarNumber: "123412341234",
    religion: "Hindu",
    caste: "General",
    category: "General",
    nationality: "India",
    city: "Ahmedabad",
    state: "Gujarat",
    ...overrides
  };
  const headers = STUDENT_IMPORT_COLUMNS.map((column) => column.key);
  const row = headers.map((header) => values[header] ?? "");
  return new File([`${headers.join(",")}\r\n${row.join(",")}\r\n`], "students.csv", { type: "text/csv" });
}

describe("student bulk import and export", () => {
  it("does not treat aliases from one class section as an ambiguous match", () => {
    expect(classSectionAliases({
      id: "class-section-1",
      academicYearId: "academic-year-1",
      displayName: "Grade 1-A",
      capacity: 40,
      currentEnrollmentCount: 0,
      academicClass: { code: "G1", name: "Grade 1" },
      section: { code: "A", name: "A" }
    })).toEqual(["grade 1-a", "grade 1 a", "g1-a"]);
  });

  it("parses a Google Sheets-compatible CSV using server-derived branch scope", async () => {
    const parsed = await parseStudentImportFile(csvFile(), branchId);

    expect(parsed.errors).toEqual([]);
    expect(parsed.totalRows).toBe(1);
    expect(parsed.rows[0]?.registration.student).toMatchObject({
      branchId,
      admissionNumber: "ADM-1001",
      fullName: "Aarav Shah",
      category: "General",
      state: "Gujarat"
    });
    expect(parsed.rows[0]?.registration.student.admissionDate).toBeInstanceOf(Date);
  });

  it("returns row and field errors for malformed records", async () => {
    const parsed = await parseStudentImportFile(csvFile({ aadhaarNumber: "123", category: "Unknown" }), branchId);

    expect(parsed.rows).toEqual([]);
    expect(parsed.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: "aadhaarNumber" }),
      expect.objectContaining({ row: 2, field: "category" })
    ]));
  });

  it("builds an Excel template with instructions and reference data", async () => {
    const buffer = await buildStudentImportTemplate("xlsx", {
      branchName: "Main Branch",
      academicYearName: "2026-27",
      classSections: ["Class 1-A"]
    });
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    await workbook.xlsx.load(workbookBuffer);

    expect(workbook.getWorksheet("Students")).toBeTruthy();
    expect(workbook.getWorksheet("Instructions")?.getCell("B2").value).toBe("Main Branch");
    expect(workbook.getWorksheet("Reference Data")?.getCell("D2").value).toBe("Class 1-A");
  });

  it("guards CSV cells against spreadsheet formula injection", async () => {
    const buffer = await buildStudentExportWorkbook(
      "csv",
      [{ key: "fullName", label: "Full Name" }],
      [{ fullName: "=HYPERLINK(\"https://example.invalid\")" }]
    );

    expect(buffer.toString("utf8")).toContain("'=HYPERLINK");
  });

  it("keeps bulk persistence tenant-scoped, masked, transactional, and audited", () => {
    const source = readFileSync(resolve(process.cwd(), "src/modules/academia/services/student-bulk.service.ts"), "utf8");
    const exportRoute = readFileSync(resolve(process.cwd(), "src/app/api/academia/students/export/route.ts"), "utf8");

    expect(source).toContain("tenantId: ctx.tenantId");
    expect(source).toContain('requireBranchPermission(ctx, "academia.student.create", branchId)');
    expect(source).toContain("maskAadhaarNumber(student.aadhaarNumber)");
    expect(source).toContain("maskBankAccountNumber(student.bankAccountNumber)");
    expect(source).toContain("STUDENT_BULK_IMPORTED");
    expect(source).toContain("db.$transaction");
    expect(exportRoute).toContain('"Cache-Control": "private, no-store"');
  });
});
