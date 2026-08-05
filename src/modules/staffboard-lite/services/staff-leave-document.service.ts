import { createHash, randomUUID } from "node:crypto";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { detectStudentDocumentMimeType, safeStudentDocumentObjectName } from "@/lib/files/student-document-file";
import { requirePermission } from "@/lib/rbac/require-permission";
import { hasPrincipalRole } from "@/lib/rbac/roles";
import {
  ensureStaffLeaveDocumentsBucket,
  getStaffLeaveStorageClient
} from "@/lib/storage/supabase-storage";
import type { TenantContext } from "@/lib/tenant/context";
import { STAFFBOARD_LITE_AUDIT_EVENTS } from "@/modules/staffboard-lite/audit-events";
import {
  staffLeaveDocumentMetadataSchema,
  staffLeaveDocumentParamsSchema
} from "@/modules/staffboard-lite/schemas";

async function requireApplicationAccess(ctx: TenantContext, applicationId: string, mutation: boolean) {
  const application = await db.staffLeaveApplication.findFirst({
    where: { id: applicationId, tenantId: ctx.tenantId, branchId: { in: ctx.accessibleBranchIds } },
    select: { id: true, branchId: true, staffId: true, status: true, staff: { select: { userId: true } } }
  });
  if (!application) throw notFound("STAFF_LEAVE_APPLICATION_NOT_FOUND");

  const ownApplication = application.staff.userId === ctx.userId;
  if (ownApplication) {
    await requirePermission({
      ctx,
      permission: mutation ? "staffboard.leave.self_apply" : "staffboard.leave.self_view",
      branchId: application.branchId
    });
    if (mutation && !(["PENDING", "CLARIFICATION_REQUIRED"] as string[]).includes(application.status)) {
      throw new AppError("STAFF_LEAVE_DOCUMENT_NOT_EDITABLE", "STAFF_LEAVE_DOCUMENT_NOT_EDITABLE", 409);
    }
  } else {
    if (mutation) throw new AppError("FORBIDDEN", "FORBIDDEN", 403);
    await requirePermission({ ctx, permission: "staffboard.leave.view", branchId: application.branchId });
    if (!hasPrincipalRole(ctx.roleCodes ?? [])) {
      const designated = await db.staffLeaveApprover.findFirst({
        where: {
          tenantId: ctx.tenantId,
          branchId: application.branchId,
          userId: ctx.userId,
          isActive: true
        },
        select: { id: true }
      });
      if (!designated) throw notFound("STAFF_LEAVE_APPLICATION_NOT_FOUND");
    }
  }
  return application;
}

export async function listStaffLeaveDocuments(ctx: TenantContext, applicationId: string) {
  const application = await requireApplicationAccess(ctx, applicationId, false);
  return db.staffLeaveDocument.findMany({
    where: {
      tenantId: ctx.tenantId,
      branchId: application.branchId,
      applicationId: application.id,
      deletedAt: null
    },
    select: {
      id: true,
      title: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function uploadStaffLeaveDocument(
  ctx: TenantContext,
  input: { applicationId: string; title: string; file: File }
) {
  const metadata = staffLeaveDocumentMetadataSchema.parse({
    applicationId: input.applicationId,
    title: input.title
  });
  const application = await requireApplicationAccess(ctx, metadata.applicationId, true);
  const { client, bucket, maxBytes, allowedMimeTypes } = getStaffLeaveStorageClient();

  if (!(input.file instanceof File) || input.file.size === 0) {
    throw new AppError("STAFF_LEAVE_DOCUMENT_FILE_REQUIRED", "STAFF_LEAVE_DOCUMENT_FILE_REQUIRED", 400);
  }
  if (input.file.size > maxBytes) {
    throw new AppError("STAFF_LEAVE_DOCUMENT_TOO_LARGE", "STAFF_LEAVE_DOCUMENT_TOO_LARGE", 400);
  }
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const detectedMimeType = detectStudentDocumentMimeType(bytes);
  if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType as (typeof allowedMimeTypes)[number])) {
    throw new AppError("STAFF_LEAVE_DOCUMENT_TYPE_NOT_ALLOWED", "STAFF_LEAVE_DOCUMENT_TYPE_NOT_ALLOWED", 400);
  }

  await ensureStaffLeaveDocumentsBucket();
  const documentId = randomUUID();
  const storagePath = `${ctx.tenantId}/${application.id}/${documentId}/${safeStudentDocumentObjectName(input.file.name, detectedMimeType)}`;
  const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
  const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, bytes, {
    contentType: detectedMimeType,
    cacheControl: "0",
    upsert: false
  });
  if (uploadError) throw new AppError("STAFF_LEAVE_DOCUMENT_UPLOAD_FAILED", "STAFF_LEAVE_DOCUMENT_UPLOAD_FAILED", 503);

  try {
    return await db.$transaction(async (tx) => {
      const document = await tx.staffLeaveDocument.create({
        data: {
          id: documentId,
          tenantId: ctx.tenantId,
          branchId: application.branchId,
          applicationId: application.id,
          title: metadata.title,
          originalFileName: input.file.name.slice(0, 255),
          storageBucket: bucket,
          storagePath,
          mimeType: detectedMimeType,
          sizeBytes: input.file.size,
          checksumSha256,
          uploadedById: ctx.userId
        }
      });
      await writeAuditLog({
        ctx,
        action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_LEAVE_DOCUMENT_UPLOADED,
        entityType: "StaffLeaveDocument",
        entityId: document.id,
        branchId: application.branchId,
        after: {
          applicationId: application.id,
          title: document.title,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes
        }
      }, tx);
      return document;
    });
  } catch (error) {
    await client.storage.from(bucket).remove([storagePath]);
    throw error;
  }
}

export async function createStaffLeaveDocumentDownloadUrl(
  ctx: TenantContext,
  applicationId: string,
  documentId: string
) {
  const params = staffLeaveDocumentParamsSchema.parse({ applicationId, documentId });
  const application = await requireApplicationAccess(ctx, params.applicationId, false);
  const document = await db.staffLeaveDocument.findFirst({
    where: {
      id: params.documentId,
      tenantId: ctx.tenantId,
      branchId: application.branchId,
      applicationId: application.id,
      deletedAt: null
    },
    select: { storageBucket: true, storagePath: true, originalFileName: true, mimeType: true }
  });
  if (!document) throw notFound("STAFF_LEAVE_DOCUMENT_NOT_FOUND");
  const { client } = getStaffLeaveStorageClient();
  const { data, error } = await client.storage.from(document.storageBucket).createSignedUrl(document.storagePath, 60, {
    download: document.mimeType.startsWith("image/") ? false : safeStudentDocumentObjectName(document.originalFileName, document.mimeType)
  });
  if (error || !data?.signedUrl) throw new AppError("STAFF_LEAVE_DOCUMENT_DOWNLOAD_FAILED", "STAFF_LEAVE_DOCUMENT_DOWNLOAD_FAILED", 503);
  return data.signedUrl;
}

export async function deleteStaffLeaveDocument(ctx: TenantContext, applicationId: string, documentId: string) {
  const params = staffLeaveDocumentParamsSchema.parse({ applicationId, documentId });
  const application = await requireApplicationAccess(ctx, params.applicationId, true);
  const document = await db.staffLeaveDocument.findFirst({
    where: {
      id: params.documentId,
      tenantId: ctx.tenantId,
      branchId: application.branchId,
      applicationId: application.id,
      deletedAt: null
    }
  });
  if (!document) throw notFound("STAFF_LEAVE_DOCUMENT_NOT_FOUND");
  const { client } = getStaffLeaveStorageClient();
  const { error } = await client.storage.from(document.storageBucket).remove([document.storagePath]);
  if (error) throw new AppError("STAFF_LEAVE_DOCUMENT_DELETE_FAILED", "STAFF_LEAVE_DOCUMENT_DELETE_FAILED", 503);

  return db.$transaction(async (tx) => {
    const deletedAt = new Date();
    const after = await tx.staffLeaveDocument.update({
      where: { id: document.id },
      data: { deletedAt, deletedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_LEAVE_DOCUMENT_DELETED,
      entityType: "StaffLeaveDocument",
      entityId: document.id,
      branchId: application.branchId,
      before: { applicationId: application.id, title: document.title, mimeType: document.mimeType, sizeBytes: document.sizeBytes },
      after: { deletedAt }
    }, tx);
    return after;
  });
}
