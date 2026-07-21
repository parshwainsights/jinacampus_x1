import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({
    hasDatabaseUrl: hasValue(process.env.DATABASE_URL),
    hasDirectUrl: hasValue(process.env.DIRECT_URL),
    hasSessionSecret: hasValue(process.env.SESSION_SECRET),
    commercialBootstrapEnabled: process.env.COMMERCIAL_BOOTSTRAP_ENABLED === "true",
    devDemoSeedEnabled: process.env.DEV_DEMO_SEED_ENABLED === "true",
    hasSeedAdminEmail: hasValue(process.env.SEED_ADMIN_EMAIL),
    hasSeedAdminPhone: hasValue(process.env.SEED_ADMIN_PHONE)
  });
}
