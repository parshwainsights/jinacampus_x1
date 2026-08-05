import { NextResponse } from "next/server";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { uploadStaffLeaveDocument } from "@/modules/staffboard-lite/services/staff-leave-document.service";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const safe = mapActionError(error, {
    fallbackMessage: "Unable to upload this supporting document. Please try again.",
    validationMessage: "Check the supporting document and try again."
  });
  return NextResponse.json(safe, {
    status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await getTenantContext();
    const { applicationId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("STAFF_LEAVE_DOCUMENT_FILE_REQUIRED", "STAFF_LEAVE_DOCUMENT_FILE_REQUIRED", 400);
    const title = typeof formData.get("title") === "string" ? String(formData.get("title")) : "";
    const document = await uploadStaffLeaveDocument(ctx, { applicationId, title, file });
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
