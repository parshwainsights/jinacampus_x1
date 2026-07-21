import type { PrismaClient } from "@prisma/client";

type SeedEnvironment = Readonly<Record<string, string | undefined>>;

export function assertDevDemoSeedAllowed(environment: SeedEnvironment = process.env) {
  const enabled = environment.DEV_DEMO_SEED_ENABLED === "true";
  if (enabled && environment.NODE_ENV === "production") {
    throw new Error("DEV_DEMO_SEED_ENABLED cannot be true when NODE_ENV=production.");
  }
  if (enabled) {
    for (const name of ["SEED_ADMIN_EMAIL", "SEED_ADMIN_TEMP_PASSWORD", "DEV_DEMO_USER_PASSWORD"] as const) {
      if (!environment[name]?.trim()) {
        throw new Error(`${name} is required when DEV_DEMO_SEED_ENABLED=true.`);
      }
    }
  }
  return enabled;
}

export async function seedDevDemo(
  db: PrismaClient,
  environment: SeedEnvironment = process.env
) {
  if (!assertDevDemoSeedAllowed(environment)) return { enabled: false as const };

  const { seedDemoTenant } = await import("./demo-tenant.seed");
  await seedDemoTenant(db);
  return { enabled: true as const };
}
