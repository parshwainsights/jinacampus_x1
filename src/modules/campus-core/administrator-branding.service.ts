import { randomUUID } from "node:crypto";
import type { z } from "zod";

import { writePlatformAuditLog } from "@/lib/audit/platform-audit-log";
import type { PlatformAdministratorContext } from "@/lib/auth/platform-administrator-session";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import {
  detectInstitutionLogoMimeType,
  institutionLogoExtension
} from "@/lib/files/institution-logo-file";
import {
  ensureInstitutionLogosBucket,
  getInstitutionLogoStorageClient
} from "@/lib/storage/supabase-storage";
import type { updateInstitutionLogoSchema } from "@/modules/campus-core/administrator-schemas";
import { PLATFORM_ADMINISTRATOR_AUDIT_EVENTS } from "@/modules/campus-core/platform-administrator-audit-events";

export async function updateInstitutionLogoForAdministrator(
  ctx: PlatformAdministratorContext,
  input: z.infer<typeof updateInstitutionLogoSchema> & { file: File }
) {
  const institution = await db.institution.findFirst({
    where: { id: input.institutionId, tenantId: input.tenantId },
    select: {
      id: true,
      tenantId: true,
      name: true,
      displayName: true,
      logoUrl: true,
      logoObjectKey: true,
      tenant: { select: { slug: true } }
    }
  });
  if (!institution) throw notFound("INSTITUTION_NOT_FOUND");
  if (!(input.file instanceof File) || input.file.size === 0) {
    throw new AppError("INSTITUTION_LOGO_FILE_REQUIRED", "INSTITUTION_LOGO_FILE_REQUIRED", 400);
  }

  const { client, bucket, maxBytes, allowedMimeTypes } = getInstitutionLogoStorageClient();
  if (input.file.size > maxBytes) {
    throw new AppError("INSTITUTION_LOGO_TOO_LARGE", "INSTITUTION_LOGO_TOO_LARGE", 400);
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const mimeType = detectInstitutionLogoMimeType(bytes);
  if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
    throw new AppError("INSTITUTION_LOGO_TYPE_NOT_ALLOWED", "INSTITUTION_LOGO_TYPE_NOT_ALLOWED", 400);
  }

  await ensureInstitutionLogosBucket();
  const objectKey = `logos/${randomUUID()}.${institutionLogoExtension(mimeType)}`;
  const { error: uploadError } = await client.storage.from(bucket).upload(objectKey, bytes, {
    contentType: mimeType,
    cacheControl: "31536000",
    upsert: false
  });
  if (uploadError) {
    throw new AppError("INSTITUTION_LOGO_UPLOAD_FAILED", "INSTITUTION_LOGO_UPLOAD_FAILED", 503);
  }

  const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(objectKey);
  const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
  const updated = await (async () => {
    try {
      return await db.$transaction(async (tx) => {
        const current = await tx.institution.findFirst({
          where: { id: input.institutionId, tenantId: input.tenantId },
          select: { id: true, logoUrl: true }
        });
        if (!current) throw notFound("INSTITUTION_NOT_FOUND");

        const after = await tx.institution.update({
          where: { id: current.id },
          data: { logoUrl, logoObjectKey: objectKey }
        });
        await writePlatformAuditLog({
          ctx,
          action: PLATFORM_ADMINISTRATOR_AUDIT_EVENTS.INSTITUTION_LOGO_UPDATED,
          entityType: "Institution",
          entityId: after.id,
          before: { logoConfigured: Boolean(current.logoUrl) },
          after: { logoConfigured: true },
          metadata: {
            targetTenantId: input.tenantId,
            mimeType,
            sizeBytes: input.file.size,
            replacedExistingLogo: Boolean(current.logoUrl)
          }
        }, tx);
        return after;
      });
    } catch (error) {
      await client.storage.from(bucket).remove([objectKey]).catch(() => undefined);
      throw error;
    }
  })();

  if (institution.logoObjectKey?.startsWith("logos/") && institution.logoObjectKey !== objectKey) {
    await client.storage.from(bucket).remove([institution.logoObjectKey]).catch(() => undefined);
  }

  return { institution: updated, tenantSlug: institution.tenant.slug };
}
