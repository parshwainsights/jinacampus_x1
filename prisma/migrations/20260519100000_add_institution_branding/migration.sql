-- Add optional institution branding fields for display-safe app shell branding.
ALTER TABLE "institutions"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "logoObjectKey" TEXT;
