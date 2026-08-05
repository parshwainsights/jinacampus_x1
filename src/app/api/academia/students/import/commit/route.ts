import { NextResponse } from "next/server";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { idSchema } from "@/modules/academia/schemas/shared";
import { importStudentRows, validateStudentBulkImport } from "@/modules/academia/services/student-bulk.service";
import { parseStudentImportFile } from "@/modules/academia/services/student-bulk-workbook.service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("STUDENT_IMPORT_FILE_REQUIRED", "STUDENT_IMPORT_FILE_REQUIRED", 400);
    const branchId = idSchema.parse(formData.get("branchId"));
    const parsed = await parseStudentImportFile(file, branchId);
    const validated = await validateStudentBulkImport(ctx, branchId, parsed.rows, parsed.errors);
    if (validated.errors.length || !validated.rows.length) {
      return NextResponse.json({
        success: false,
        error: "Resolve every spreadsheet error before importing student records.",
        errors: validated.errors.slice(0, 250)
      }, { status: 422 });
    }
    const result = await importStudentRows(ctx, branchId, validated.rows);
    return NextResponse.json({
      success: true,
      message: `${result.total} student records imported successfully.`,
      summary: result
    });
  } catch (error) {
    const safe = mapActionError(error, {
      fallbackMessage: "Unable to import student records. No partial import was saved.",
      validationMessage: "Check the spreadsheet and try again."
    });
    return NextResponse.json(safe, {
      status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
    });
  }
}
