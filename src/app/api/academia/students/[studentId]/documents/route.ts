import { NextResponse } from "next/server";
import { AppError, getSafeHttpStatus, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { studentDocumentTypeSchema } from "@/modules/academia/schemas/student-document.schema";
import { uploadStudentDocument } from "@/modules/academia/services/student-document.service";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const safe = mapActionError(error, {
    fallbackMessage: "Unable to upload this document. Please try again.",
    validationMessage: "Check the document details and try again."
  });
  return NextResponse.json(safe, {
    status: getSafeHttpStatus(error)
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const ctx = await getTenantContext();
    const { studentId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new AppError("STUDENT_DOCUMENT_FILE_REQUIRED", "STUDENT_DOCUMENT_FILE_REQUIRED", 400);
    }
    const type = studentDocumentTypeSchema.parse(formData.get("type"));
    const titleValue = formData.get("title");
    const title = typeof titleValue === "string" ? titleValue : "";
    const document = await uploadStudentDocument(ctx, { studentId, type, title, file });
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
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
