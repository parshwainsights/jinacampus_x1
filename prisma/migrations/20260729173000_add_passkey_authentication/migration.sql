-- CreateEnum
CREATE TYPE "PasskeyChallengePurpose" AS ENUM ('REGISTRATION', 'AUTHENTICATION');

-- CreateTable
CREATE TABLE "passkey_credentials" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passkey_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey_challenges" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "purpose" "PasskeyChallengePurpose" NOT NULL,
    "challenge" TEXT NOT NULL,
    "identifierHash" TEXT,
    "identifierType" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkey_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "passkey_credentials_credentialId_key" ON "passkey_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "passkey_credentials_tenantId_userId_idx" ON "passkey_credentials"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "passkey_credentials_tenantId_lastUsedAt_idx" ON "passkey_credentials"("tenantId", "lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "passkey_challenges_challenge_key" ON "passkey_challenges"("challenge");

-- CreateIndex
CREATE INDEX "passkey_challenges_tenantId_userId_purpose_idx" ON "passkey_challenges"("tenantId", "userId", "purpose");

-- CreateIndex
CREATE INDEX "passkey_challenges_tenantId_ipAddress_createdAt_idx" ON "passkey_challenges"("tenantId", "ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "passkey_challenges_expiresAt_idx" ON "passkey_challenges"("expiresAt");

-- AddForeignKey
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey_challenges" ADD CONSTRAINT "passkey_challenges_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey_challenges" ADD CONSTRAINT "passkey_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add the self-only attendance permission used by the Staff role.
INSERT INTO "permissions" ("id", "code", "module", "description", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'staffboard.attendance.self_view', 'STAFFBOARD', 'View only the authenticated staff member''s attendance.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Convert legacy school administrator roles into exact Principal aliases.
DELETE FROM "role_permissions" AS role_permission
USING "roles" AS role
WHERE role_permission."roleId" = role."id"
  AND role."code" IN ('TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN');

-- Legacy school administrator roles inherit each tenant's Principal permissions.
INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), legacy_role."tenantId", legacy_role."id", principal_permission."permissionId", CURRENT_TIMESTAMP
FROM "roles" AS legacy_role
JOIN "roles" AS principal_role
  ON principal_role."tenantId" = legacy_role."tenantId"
 AND principal_role."code" = 'PRINCIPAL'
JOIN "role_permissions" AS principal_permission
  ON principal_permission."tenantId" = principal_role."tenantId"
 AND principal_permission."roleId" = principal_role."id"
WHERE legacy_role."code" IN ('TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN')
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;

-- Teachers mark only server-derived assigned class-sections and can view their own staff attendance.
INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), role."tenantId", role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" AS role
JOIN "permissions" AS permission
  ON permission."code" IN (
    'academia.attendance.mark',
    'academia.attendance.report',
    'staffboard.attendance.self_view'
  )
WHERE role."code" IN ('TEACHER', 'CLASS_TEACHER')
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), role."tenantId", role."id", permission."id", CURRENT_TIMESTAMP
FROM "roles" AS role
JOIN "permissions" AS permission
  ON permission."code" = 'staffboard.attendance.self_view'
WHERE role."code" IN ('STAFF', 'OFFICE_STAFF')
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;

UPDATE "roles" SET "name" = 'Platform Administrator' WHERE "code" = 'ADMINISTRATOR';
UPDATE "roles" SET "name" = 'Office Operator' WHERE "code" = 'OFFICE_STAFF';
UPDATE "roles" SET "name" = 'Principal (Legacy Alias)' WHERE "code" IN ('TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN');
UPDATE "roles" SET "name" = 'Teacher (Legacy Alias)' WHERE "code" = 'CLASS_TEACHER';
