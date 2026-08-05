import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { idSchema } from "@/modules/academia/schemas/shared";
import { exportStudentRecords } from "@/modules/academia/services/student-bulk.service";
import { buildStudentExportWorkbook } from "@/modules/academia/services/student-bulk-workbook.service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext();
    const url = new URL(request.url);
    const branchId = idSchema.parse(url.searchParams.get("branchId"));
    const format = z.enum(["xlsx", "csv"]).default("xlsx").parse(url.searchParams.get("format") ?? undefined);
    const exportData = await exportStudentRecords(ctx, branchId);
    const body = await buildStudentExportWorkbook(format, exportData.columns, exportData.rows);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jinacampus-students-${date}.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    const safe = mapActionError(error, { fallbackMessage: "Unable to export student records." });
    return NextResponse.json(safe, {
      status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
    });
  }
}
