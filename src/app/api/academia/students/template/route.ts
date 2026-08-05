import { NextResponse } from "next/server";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { idSchema } from "@/modules/academia/schemas/shared";
import { getStudentBulkReferenceData } from "@/modules/academia/services/student-bulk.service";
import { buildStudentImportTemplate } from "@/modules/academia/services/student-bulk-workbook.service";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext();
    const url = new URL(request.url);
    const branchId = idSchema.parse(url.searchParams.get("branchId"));
    const format = z.enum(["xlsx", "csv"]).default("xlsx").parse(url.searchParams.get("format") ?? undefined);
    const reference = await getStudentBulkReferenceData(ctx, branchId);
    const body = await buildStudentImportTemplate(format, reference);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jinacampus-student-import-template.${format}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    const safe = mapActionError(error, { fallbackMessage: "Unable to create the student import template." });
    return NextResponse.json(safe, {
      status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
    });
  }
}
