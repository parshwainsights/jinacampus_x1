import { NextResponse } from "next/server";
import { AppError, mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import {
  createStaffLeaveDocumentDownloadUrl,
  deleteStaffLeaveDocument
} from "@/modules/staffboard-lite/services/staff-leave-document.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ applicationId: string; documentId: string }> };

function errorResponse(error: unknown, fallbackMessage: string) {
  const safe = mapActionError(error, { fallbackMessage });
  return NextResponse.json(safe, {
    status: error instanceof AppError ? error.status : safe.code === "VALIDATION_ERROR" ? 400 : 500
  });
}
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTenantContext();
    const { applicationId, documentId } = await params;
    const signedUrl = await createStaffLeaveDocumentDownloadUrl(ctx, applicationId, documentId);
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    return errorResponse(error, "Unable to open this supporting document. Please try again.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTenantContext();
    const { applicationId, documentId } = await params;
    await deleteStaffLeaveDocument(ctx, applicationId, documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete this supporting document. Please try again.");
  }
}
