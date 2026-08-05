import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import {
  INDIAN_STATE_OPTIONS,
  NATIONALITY_OPTIONS,
  STUDENT_CATEGORY_OPTIONS,
  STUDENT_RELIGION_OPTIONS
} from "@/modules/academia/student-registration-options";
import {
  MAX_STUDENT_IMPORT_FILE_BYTES,
  MAX_STUDENT_IMPORT_ROWS,
  REQUIRED_STUDENT_IMPORT_COLUMNS,
  STUDENT_IMPORT_COLUMNS,
  type StudentImportColumnKey
} from "@/modules/academia/student-bulk-columns";
import {
  createStudentRegistrationSchema,
  type CreateStudentRegistrationInput
} from "@/modules/academia/schemas";

type ImportRowValues = Partial<Record<StudentImportColumnKey, string>>;

export type StudentImportError = {
  row: number;
  field: string;
  message: string;
};

export type ParsedStudentImportRow = {
  rowNumber: number;
  registration: CreateStudentRegistrationInput;
  classSectionLabel?: string;
  rollNumber?: string;
  enrollmentDate?: Date;
};

export type StudentExportRow = Record<string, string | number | Date | null | undefined>;

const HEADER_BY_NORMALIZED_VALUE = new Map<string, StudentImportColumnKey>();
for (const column of STUDENT_IMPORT_COLUMNS) {
  HEADER_BY_NORMALIZED_VALUE.set(normalizeHeader(column.key), column.key);
  HEADER_BY_NORMALIZED_VALUE.set(normalizeHeader(column.label), column.key);
}

const GENDER_VALUES = new Map([
  ["male", "MALE"],
  ["female", "FEMALE"],
  ["other", "OTHER"],
  ["notspecified", "NOT_SPECIFIED"],
  ["", "NOT_SPECIFIED"]
]);

const BLOOD_GROUP_VALUES = new Map([
  ["a+", "A_POSITIVE"], ["apositive", "A_POSITIVE"],
  ["a-", "A_NEGATIVE"], ["anegative", "A_NEGATIVE"],
  ["b+", "B_POSITIVE"], ["bpositive", "B_POSITIVE"],
  ["b-", "B_NEGATIVE"], ["bnegative", "B_NEGATIVE"],
  ["ab+", "AB_POSITIVE"], ["abpositive", "AB_POSITIVE"],
  ["ab-", "AB_NEGATIVE"], ["abnegative", "AB_NEGATIVE"],
  ["o+", "O_POSITIVE"], ["opositive", "O_POSITIVE"],
  ["o-", "O_NEGATIVE"], ["onegative", "O_NEGATIVE"],
  ["unknown", "UNKNOWN"]
]);

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function optionValue(value: string | undefined, options: readonly string[]) {
  if (!value) return value;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) ?? value.trim();
}

function enumValue(value: string | undefined, values: Map<string, string>) {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, "");
  return values.get(normalized) ?? value.trim().toUpperCase().replaceAll(" ", "_");
}

function dateValue(value: ExcelJS.CellValue): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  }
  return cellText(value);
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if ("result" in value && value.result !== undefined) return cellText(value.result);
  if ("text" in value && typeof value.text === "string") return value.text.trim();
  if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
  return "";
}

function spreadsheetDate(row: ImportRowValues, key: StudentImportColumnKey) {
  const value = row[key];
  return value?.trim() || undefined;
}

function issuePath(issue: z.ZodIssue) {
  const path = issue.path.join(".");
  return path.replace(/^student\./, "").replace(/^primaryGuardian\./, "guardian.") || "row";
}

function parseRegistrationRow(rowNumber: number, branchId: string, values: ImportRowValues) {
  const result = createStudentRegistrationSchema.safeParse({
    student: {
      branchId,
      admissionNumber: values.admissionNumber,
      admissionDate: spreadsheetDate(values, "admissionDate"),
      fullName: values.fullName,
      displayName: values.displayName,
      dateOfBirth: spreadsheetDate(values, "dateOfBirth"),
      gender: enumValue(values.gender, GENDER_VALUES),
      bloodGroup: values.bloodGroup ? enumValue(values.bloodGroup, BLOOD_GROUP_VALUES) : undefined,
      fatherName: values.fatherName,
      fatherOccupation: values.fatherOccupation,
      motherName: values.motherName,
      guardianName: values.guardianName,
      aadhaarNumber: values.aadhaarNumber,
      familyIdNumber: values.familyIdNumber,
      sssmIdNumber: values.sssmIdNumber,
      apaarIdNumber: values.apaarIdNumber,
      religion: optionValue(values.religion, STUDENT_RELIGION_OPTIONS),
      caste: values.caste,
      category: optionValue(values.category, STUDENT_CATEGORY_OPTIONS),
      nationality: optionValue(values.nationality, NATIONALITY_OPTIONS),
      currentAddress: values.currentAddress,
      permanentAddress: values.permanentAddress,
      city: values.city,
      state: optionValue(values.state, INDIAN_STATE_OPTIONS),
      pincode: values.pincode,
      bankAccountNumber: values.bankAccountNumber,
      bankBranchName: values.bankBranchName,
      ifscCode: values.ifscCode,
      status: "ACTIVE",
      joinedAt: spreadsheetDate(values, "admissionDate")
    },
    primaryGuardian: {
      relation: values.guardianRelation?.trim().toUpperCase(),
      phone: values.guardianPhone,
      email: values.guardianEmail,
      isEmergencyContact: true,
      hasPickupPermission: true
    }
  });

  if (!result.success) {
    return {
      errors: result.error.issues.map((issue) => ({
        row: rowNumber,
        field: issuePath(issue),
        message: issue.message
      })) satisfies StudentImportError[]
    };
  }

  const enrollmentDate = spreadsheetDate(values, "enrollmentDate");
  const parsedEnrollmentDate = enrollmentDate ? new Date(`${enrollmentDate}T00:00:00.000Z`) : undefined;
  if (parsedEnrollmentDate && Number.isNaN(parsedEnrollmentDate.valueOf())) {
    return { errors: [{ row: rowNumber, field: "enrollmentDate", message: "Enter a valid enrollment date." }] };
  }

  return {
    row: {
      rowNumber,
      registration: result.data,
      classSectionLabel: values.classSection?.trim() || undefined,
      rollNumber: values.rollNumber?.trim() || undefined,
      enrollmentDate: parsedEnrollmentDate
    } satisfies ParsedStudentImportRow
  };
}

async function loadWorkbook(file: File) {
  if (file.size === 0 || file.size > MAX_STUDENT_IMPORT_FILE_BYTES) {
    throw new AppError("STUDENT_IMPORT_FILE_SIZE_INVALID", "STUDENT_IMPORT_FILE_SIZE_INVALID", 400);
  }
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
    throw new AppError("STUDENT_IMPORT_FILE_TYPE_INVALID", "STUDENT_IMPORT_FILE_TYPE_INVALID", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    if (lowerName.endsWith(".csv")) {
      await workbook.csv.read(Readable.from([buffer]));
    } else {
      const workbookBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer;
      await workbook.xlsx.load(workbookBuffer);
    }
  } catch {
    throw new AppError("STUDENT_IMPORT_FILE_INVALID", "STUDENT_IMPORT_FILE_INVALID", 400);
  }
  return workbook;
}

export async function parseStudentImportFile(file: File, branchId: string) {
  const workbook = await loadWorkbook(file);
  const sheet = workbook.getWorksheet("Students") ?? workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) {
    throw new AppError("STUDENT_IMPORT_SHEET_MISSING", "STUDENT_IMPORT_SHEET_MISSING", 400);
  }

  const headers = new Map<number, StudentImportColumnKey>();
  const seenHeaders = new Set<StudentImportColumnKey>();
  const headerErrors: StudentImportError[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = HEADER_BY_NORMALIZED_VALUE.get(normalizeHeader(cellText(cell.value)));
    if (!header) return;
    if (seenHeaders.has(header)) {
      headerErrors.push({ row: 1, field: header, message: "This column appears more than once." });
      return;
    }
    seenHeaders.add(header);
    headers.set(columnNumber, header);
  });
  for (const required of REQUIRED_STUDENT_IMPORT_COLUMNS) {
    if (!seenHeaders.has(required)) {
      headerErrors.push({ row: 1, field: required, message: "Required column is missing." });
    }
  }
  if (headerErrors.length) return { rows: [], errors: headerErrors, totalRows: 0 };

  const rows: ParsedStudentImportRow[] = [];
  const errors: StudentImportError[] = [];
  let processedRows = 0;
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const values: ImportRowValues = {};
    let populated = false;
    for (const [columnNumber, key] of headers) {
      const rawValue = row.getCell(columnNumber).value;
      const value = key.includes("Date") || key === "dateOfBirth" ? dateValue(rawValue) : cellText(rawValue);
      if (value) populated = true;
      values[key] = value;
    }
    if (!populated) continue;
    if (processedRows >= MAX_STUDENT_IMPORT_ROWS) {
      errors.push({ row: rowNumber, field: "file", message: `A file can contain at most ${MAX_STUDENT_IMPORT_ROWS} student rows.` });
      break;
    }
    processedRows += 1;
    const parsed = parseRegistrationRow(rowNumber, branchId, values);
    if (parsed.errors) errors.push(...parsed.errors);
    else if (parsed.row) rows.push(parsed.row);
  }

  if (!rows.length && !errors.length) {
    errors.push({ row: 2, field: "file", message: "Add at least one student row." });
  }
  return { rows, errors, totalRows: processedRows };
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3D78" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

export async function buildStudentImportTemplate(format: "xlsx" | "csv", reference: {
  branchName: string;
  academicYearName?: string | null;
  classSections: string[];
}) {
  if (format === "csv") {
    const header = STUDENT_IMPORT_COLUMNS.map((column) => column.key).join(",");
    return Buffer.from(`\uFEFF${header}\r\n`, "utf8");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JinaCampus";
  workbook.created = new Date();
  const students = workbook.addWorksheet("Students", { views: [{ state: "frozen", ySplit: 1 }] });
  students.addRow(STUDENT_IMPORT_COLUMNS.map((column) => `${column.key}${column.required ? " *" : ""}`));
  styleHeader(students.getRow(1));
  students.autoFilter = { from: "A1", to: `${students.getColumn(STUDENT_IMPORT_COLUMNS.length).letter}1` };
  STUDENT_IMPORT_COLUMNS.forEach((column, index) => {
    students.getColumn(index + 1).width = Math.min(32, Math.max(16, column.label.length + 3));
  });
  for (let row = 2; row <= 101; row += 1) {
    students.getCell(row, 6).dataValidation = { type: "list", allowBlank: true, formulae: ['"MALE,FEMALE,OTHER,NOT_SPECIFIED"'] };
    students.getCell(row, 12).dataValidation = { type: "list", allowBlank: false, formulae: ['"FATHER,MOTHER,GUARDIAN"'] };
    students.getCell(row, 19).dataValidation = { type: "list", allowBlank: false, formulae: [`'Reference Data'!$A$2:$A$${STUDENT_RELIGION_OPTIONS.length + 1}`] };
    students.getCell(row, 21).dataValidation = { type: "list", allowBlank: false, formulae: [`'Reference Data'!$B$2:$B$${STUDENT_CATEGORY_OPTIONS.length + 1}`] };
    students.getCell(row, 26).dataValidation = { type: "list", allowBlank: false, formulae: [`'Reference Data'!$C$2:$C$${INDIAN_STATE_OPTIONS.length + 1}`] };
    if (reference.classSections.length) {
      students.getCell(row, 31).dataValidation = { type: "list", allowBlank: true, formulae: [`'Reference Data'!$D$2:$D$${reference.classSections.length + 1}`] };
    }
  }

  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [{ width: 28 }, { width: 90 }];
  instructions.addRows([
    ["JinaCampus Student Import", "Use the Students sheet without renaming or deleting required columns."],
    ["Branch", reference.branchName],
    ["Academic Year", reference.academicYearName ?? "No active academic year"],
    ["Required fields", "Columns marked with * must contain a value."],
    ["Dates", "Use YYYY-MM-DD. Google Sheets and Excel date cells are also accepted."],
    ["Aadhaar", "Format as text and enter 12 digits. JinaCampus stores only a masked value and last four digits."],
    ["Class assignment", "Use an exact Class Section value from Reference Data, or leave blank to enroll later."],
    ["Validation", "Preview the file before import. Imports are rejected unless every row is valid."],
    ["Limit", `${MAX_STUDENT_IMPORT_ROWS} student rows per file.`]
  ]);
  styleHeader(instructions.getRow(1));
  instructions.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });

  const referenceData = workbook.addWorksheet("Reference Data");
  referenceData.addRow(["Religion", "Category", "State / UT", "Class Section"]);
  styleHeader(referenceData.getRow(1));
  const referenceLength = Math.max(
    STUDENT_RELIGION_OPTIONS.length,
    STUDENT_CATEGORY_OPTIONS.length,
    INDIAN_STATE_OPTIONS.length,
    reference.classSections.length
  );
  for (let index = 0; index < referenceLength; index += 1) {
    referenceData.addRow([
      STUDENT_RELIGION_OPTIONS[index] ?? "",
      STUDENT_CATEGORY_OPTIONS[index] ?? "",
      INDIAN_STATE_OPTIONS[index] ?? "",
      reference.classSections[index] ?? ""
    ]);
  }
  referenceData.columns = [{ width: 24 }, { width: 18 }, { width: 42 }, { width: 32 }];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function safeCsvValue(value: unknown) {
  const text = value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

export async function buildStudentExportWorkbook(
  format: "xlsx" | "csv",
  columns: readonly { key: string; label: string }[],
  rows: StudentExportRow[]
) {
  if (format === "csv") {
    const lines = [
      columns.map((column) => safeCsvValue(column.label)).join(","),
      ...rows.map((row) => columns.map((column) => safeCsvValue(row[column.key])).join(","))
    ];
    return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JinaCampus";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Students", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((column) => ({ header: column.label, key: column.key, width: Math.min(32, Math.max(16, column.label.length + 3)) }));
  styleHeader(sheet.getRow(1));
  sheet.autoFilter = { from: "A1", to: `${sheet.getColumn(columns.length).letter}1` };
  for (const row of rows) sheet.addRow(row);
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
