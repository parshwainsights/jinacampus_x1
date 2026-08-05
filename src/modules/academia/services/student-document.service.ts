import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { AppError, notFound } from "@/lib/errors";
import type { TenantContext } from "@/lib/tenant/context";
import {
  detectStudentDocumentMimeType,
  safeStudentDocumentObjectName
} from "@/lib/files/student-document-file";
import {
  ensureStudentDocumentsBucket,
  getStudentStorageClient
} from "@/lib/storage/supabase-storage";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import {
  studentDocumentMetadataSchema,
  studentDocumentParamsSchema,
  type StudentDocumentTypeValue
} from "@/modules/academia/schemas/student-document.schema";
import { requireBranchPermission } from "./shared";

async function requireStudentDocumentAccess(ctx: TenantContext, studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: ctx.tenantId },
    select: { id: true, branchId: true }
  });
  if (!student) throw notFound("STUDENT_NOT_FOUND");
  await requireBranchPermission(ctx, "academia.student.update", student.branchId);
  return student;
}

export async function listStudentDocuments(ctx: TenantContext, studentId: string) {
  const student = await requireStudentDocumentAccess(ctx, studentId);
  return db.studentDocument.findMany({
    where: {
      tenantId: ctx.tenantId,
      branchId: student.branchId,
      studentId: student.id,
      deletedAt: null
    },
    select: {
      id: true,
      type: true,
      title: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }]
  });
}

export async function uploadStudentDocument(
  ctx: TenantContext,
  input: { studentId: string; type: StudentDocumentTypeValue; title: string; file: File }
) {
  const metadata = studentDocumentMetadataSchema.parse({
    studentId: input.studentId,
    type: input.type,
    title: input.title
  });
  const student = await requireStudentDocumentAccess(ctx, metadata.studentId);
  const { bucket, maxBytes, allowedMimeTypes, client } = getStudentStorageClient();

  if (!(input.file instanceof File) || input.file.size === 0) {
    throw new AppError("STUDENT_DOCUMENT_FILE_REQUIRED", "STUDENT_DOCUMENT_FILE_REQUIRED", 400);
  }
  if (input.file.size > maxBytes) {
    throw new AppError("STUDENT_DOCUMENT_TOO_LARGE", "STUDENT_DOCUMENT_TOO_LARGE", 400);
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const detectedMimeType = detectStudentDocumentMimeType(bytes);
  if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType as (typeof allowedMimeTypes)[number])) {
    throw new AppError("STUDENT_DOCUMENT_TYPE_NOT_ALLOWED", "STUDENT_DOCUMENT_TYPE_NOT_ALLOWED", 400);
  }
  if (metadata.type === "PASSPORT_PHOTO" && !detectedMimeType.startsWith("image/")) {
    throw new AppError("STUDENT_PHOTO_MUST_BE_IMAGE", "STUDENT_PHOTO_MUST_BE_IMAGE", 400);
  }

  await ensureStudentDocumentsBucket();
  const documentId = randomUUID();
  const storagePath = `${ctx.tenantId}/${student.id}/${documentId}/${safeStudentDocumentObjectName(input.file.name, detectedMimeType)}`;
  const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
  const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, bytes, {
    contentType: detectedMimeType,
    cacheControl: "0",
    upsert: false
  });
  if (uploadError) {
    throw new AppError("STUDENT_DOCUMENT_UPLOAD_FAILED", "STUDENT_DOCUMENT_UPLOAD_FAILED", 503);
  }

  try {
    return await db.$transaction(async (tx) => {
      const document = await tx.studentDocument.create({
        data: {
          id: documentId,
          tenantId: ctx.tenantId,
          branchId: student.branchId,
          studentId: student.id,
          type: metadata.type,
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
        action: ACADEMIA_AUDIT_EVENTS.STUDENT_DOCUMENT_UPLOADED,
        entityType: "StudentDocument",
        entityId: document.id,
        branchId: student.branchId,
        after: {
          studentId: student.id,
          type: document.type,
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

export async function createStudentDocumentDownloadUrl(
  ctx: TenantContext,
  studentId: string,
  documentId: string
) {
  const params = studentDocumentParamsSchema.parse({ studentId, documentId });
  const student = await requireStudentDocumentAccess(ctx, params.studentId);
  const document = await db.studentDocument.findFirst({
    where: {
      id: params.documentId,
      tenantId: ctx.tenantId,
      branchId: student.branchId,
      studentId: student.id,
      deletedAt: null
    },
    select: {
      storageBucket: true,
      storagePath: true,
      originalFileName: true,
      mimeType: true
    }
  });
  if (!document) throw notFound("STUDENT_DOCUMENT_NOT_FOUND");

  const { client } = getStudentStorageClient();
  const { data, error } = await client.storage
    .from(document.storageBucket)
    .createSignedUrl(document.storagePath, 60, {
      download: document.mimeType.startsWith("image/")
        ? false
        : safeStudentDocumentObjectName(document.originalFileName, document.mimeType)
    });
  if (error || !data?.signedUrl) {
    throw new AppError("STUDENT_DOCUMENT_DOWNLOAD_FAILED", "STUDENT_DOCUMENT_DOWNLOAD_FAILED", 503);
  }
  return data.signedUrl;
}

export async function deleteStudentDocument(
  ctx: TenantContext,
  studentId: string,
  documentId: string
) {
  const params = studentDocumentParamsSchema.parse({ studentId, documentId });
  const student = await requireStudentDocumentAccess(ctx, params.studentId);
  const document = await db.studentDocument.findFirst({
    where: {
      id: params.documentId,
      tenantId: ctx.tenantId,
      branchId: student.branchId,
      studentId: student.id,
      deletedAt: null
    }
  });
  if (!document) throw notFound("STUDENT_DOCUMENT_NOT_FOUND");

  const { client } = getStudentStorageClient();
  const { error: removeError } = await client.storage
    .from(document.storageBucket)
    .remove([document.storagePath]);
  if (removeError) {
    throw new AppError("STUDENT_DOCUMENT_DELETE_FAILED", "STUDENT_DOCUMENT_DELETE_FAILED", 503);
  }

  return db.$transaction(async (tx) => {
    const deletedAt = new Date();
    const after = await tx.studentDocument.update({
      where: { id: document.id },
      data: { deletedAt, deletedById: ctx.userId }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.STUDENT_DOCUMENT_DELETED,
      entityType: "StudentDocument",
      entityId: document.id,
      branchId: student.branchId,
      before: {
        studentId: document.studentId,
        type: document.type,
        title: document.title,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes
      },
      after: { deletedAt }
    }, tx);
    return after;
  });
}
