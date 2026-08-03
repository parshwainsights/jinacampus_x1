-- CreateEnum
CREATE TYPE "PlatformAdministratorStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateTable
CREATE TABLE "platform_administrators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "PlatformAdministratorStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_administrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_administrator_credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "administratorId" UUID NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustChange" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_administrator_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_administrator_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "administratorId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_administrator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorAdministratorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_administrators_email_key" ON "platform_administrators"("email");
CREATE INDEX "platform_administrators_status_idx" ON "platform_administrators"("status");
CREATE UNIQUE INDEX "platform_administrator_credentials_administratorId_key" ON "platform_administrator_credentials"("administratorId");
CREATE UNIQUE INDEX "platform_administrator_sessions_tokenHash_key" ON "platform_administrator_sessions"("tokenHash");
CREATE INDEX "platform_administrator_sessions_administratorId_revokedAt_idx" ON "platform_administrator_sessions"("administratorId", "revokedAt");
CREATE INDEX "platform_administrator_sessions_expiresAt_idx" ON "platform_administrator_sessions"("expiresAt");
CREATE INDEX "platform_audit_logs_actorAdministratorId_createdAt_idx" ON "platform_audit_logs"("actorAdministratorId", "createdAt");
CREATE INDEX "platform_audit_logs_action_createdAt_idx" ON "platform_audit_logs"("action", "createdAt");
CREATE INDEX "platform_audit_logs_entityType_entityId_idx" ON "platform_audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "platform_administrator_credentials"
ADD CONSTRAINT "platform_administrator_credentials_administratorId_fkey"
FOREIGN KEY ("administratorId") REFERENCES "platform_administrators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_administrator_sessions"
ADD CONSTRAINT "platform_administrator_sessions_administratorId_fkey"
FOREIGN KEY ("administratorId") REFERENCES "platform_administrators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_audit_logs"
ADD CONSTRAINT "platform_audit_logs_actorAdministratorId_fkey"
FOREIGN KEY ("actorAdministratorId") REFERENCES "platform_administrators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing active platform operators without copying or exposing raw passwords.
INSERT INTO "platform_administrators" (
    "id",
    "email",
    "displayName",
    "status",
    "lastLoginAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    candidate."email",
    candidate."displayName",
    'ACTIVE'::"PlatformAdministratorStatus",
    candidate."lastLoginAt",
    candidate."createdAt",
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (LOWER(u."email"))
        LOWER(u."email") AS "email",
        COALESCE(NULLIF(u."displayName", ''), NULLIF(CONCAT_WS(' ', u."firstName", u."lastName"), ''), LOWER(u."email")) AS "displayName",
        u."lastLoginAt",
        u."createdAt"
    FROM "users" u
    INNER JOIN "password_credentials" pc ON pc."userId" = u."id"
    INNER JOIN "user_role_assignments" ura ON ura."userId" = u."id" AND ura."tenantId" = u."tenantId"
    INNER JOIN "roles" r ON r."id" = ura."roleId" AND r."tenantId" = u."tenantId"
    WHERE u."status" = 'ACTIVE'
      AND ura."isActive" = true
      AND r."isActive" = true
      AND r."code" = 'ADMINISTRATOR'
    ORDER BY LOWER(u."email"), u."createdAt" ASC
) candidate;

INSERT INTO "platform_administrator_credentials" (
    "id",
    "administratorId",
    "passwordHash",
    "passwordUpdatedAt",
    "mustChange",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT ON (pa."id")
    gen_random_uuid(),
    pa."id",
    pc."passwordHash",
    pc."passwordUpdatedAt",
    pc."mustChange",
    pc."createdAt",
    CURRENT_TIMESTAMP
FROM "platform_administrators" pa
INNER JOIN "users" u ON LOWER(u."email") = pa."email"
INNER JOIN "password_credentials" pc ON pc."userId" = u."id"
INNER JOIN "user_role_assignments" ura ON ura."userId" = u."id" AND ura."tenantId" = u."tenantId"
INNER JOIN "roles" r ON r."id" = ura."roleId" AND r."tenantId" = u."tenantId"
WHERE u."status" = 'ACTIVE'
  AND ura."isActive" = true
  AND r."isActive" = true
  AND r."code" = 'ADMINISTRATOR'
ORDER BY pa."id", u."createdAt" ASC;

INSERT INTO "platform_audit_logs" (
    "id",
    "actorAdministratorId",
    "action",
    "entityType",
    "entityId",
    "metadataJson",
    "createdAt"
)
SELECT
    gen_random_uuid(),
    pa."id",
    'platform.administrator.migrated',
    'PlatformAdministrator',
    pa."id"::TEXT,
    jsonb_build_object('source', 'tenant_administrator_role', 'tenantRoleAssignmentsDeactivated', true),
    CURRENT_TIMESTAMP
FROM "platform_administrators" pa;

-- Revoke school sessions and retire tenant ADMINISTRATOR assignments. School identities remain intact.
UPDATE "sessions" s
SET "revokedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
WHERE s."revokedAt" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "user_role_assignments" ura
    INNER JOIN "roles" r ON r."id" = ura."roleId" AND r."tenantId" = ura."tenantId"
    WHERE ura."userId" = s."userId"
      AND ura."tenantId" = s."tenantId"
      AND ura."isActive" = true
      AND r."isActive" = true
      AND r."code" = 'ADMINISTRATOR'
  );

UPDATE "user_role_assignments" ura
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
FROM "roles" r
WHERE r."id" = ura."roleId"
  AND r."tenantId" = ura."tenantId"
  AND ura."isActive" = true
  AND r."code" = 'ADMINISTRATOR';

-- These platform-owned tables are server-only. No anon/authenticated RLS policies are created.
ALTER TABLE "platform_administrators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_administrator_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_administrator_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_audit_logs" ENABLE ROW LEVEL SECURITY;
