import { NextResponse } from "next/server";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import {
  createStudentDocumentDownloadUrl,
  deleteStudentDocument
} from "@/modules/academia/services/student-document.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string; documentId: string }>;
};

function errorResponse(error: unknown, fallbackMessage: string) {
  const safe = mapActionError(error, { fallbackMessage });
  return NextResponse.json(safe, {
    status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTenantContext();
    const { studentId, documentId } = await params;
    const signedUrl = await createStudentDocumentDownloadUrl(ctx, studentId, documentId);
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    return errorResponse(error, "Unable to open this document. Please try again.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTenantContext();
    const { studentId, documentId } = await params;
    await deleteStudentDocument(ctx, studentId, documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete this document. Please try again.");
  }
}
