-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('ADMIN_LOGIN', 'FORGOT_PASSWORD');

-- CreateTable
CREATE TABLE "login_otps" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_otps_tenantId_phone_purpose_idx" ON "login_otps"("tenantId", "phone", "purpose");

-- CreateIndex
CREATE INDEX "login_otps_tenantId_userId_idx" ON "login_otps"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "login_otps_expiresAt_idx" ON "login_otps"("expiresAt");

-- AddForeignKey
ALTER TABLE "login_otps" ADD CONSTRAINT "login_otps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_otps" ADD CONSTRAINT "login_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
