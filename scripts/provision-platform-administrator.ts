import { z } from "zod";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";

const inputSchema = z.object({
  enabled: z.literal("true"),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  temporaryPassword: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(160).default("JinaCampus Administrator")
});

async function main() {
  const input = inputSchema.parse({
    enabled: process.env.PLATFORM_ADMIN_BOOTSTRAP_ENABLED,
    email: process.env.PLATFORM_ADMIN_EMAIL,
    temporaryPassword: process.env.PLATFORM_ADMIN_TEMP_PASSWORD,
    displayName: process.env.PLATFORM_ADMIN_DISPLAY_NAME ?? "JinaCampus Administrator"
  });
  const passwordHash = await hashPassword(input.temporaryPassword);

  const result = await db.$transaction(async (tx) => {
    const administrator = await tx.platformAdministrator.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        displayName: input.displayName,
        status: "ACTIVE"
      },
      update: {
        displayName: input.displayName,
        status: "ACTIVE"
      }
    });

    await tx.platformAdministratorCredential.upsert({
      where: { administratorId: administrator.id },
      create: {
        administratorId: administrator.id,
        passwordHash,
        mustChange: true
      },
      update: {
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChange: true
      }
    });
    const revokedSessions = await tx.platformAdministratorSession.updateMany({
      where: { administratorId: administrator.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await tx.platformAuditLog.create({
      data: {
        actorAdministratorId: administrator.id,
        action: "platform.administrator.provisioned",
        entityType: "PlatformAdministrator",
        entityId: administrator.id,
        metadataJson: {
          temporaryPasswordSet: true,
          mustChange: true,
          sessionsRevoked: revokedSessions.count
        }
      }
    });
    return administrator;
  });

  process.stdout.write(JSON.stringify({
    ok: true,
    administratorId: result.id,
    email: result.email,
    mustChange: true
  }));
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown provisioning error";
    process.stderr.write(JSON.stringify({ ok: false, error: message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
