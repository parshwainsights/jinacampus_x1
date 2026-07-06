import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./seeds/permissions.seed";
import { seedDemoTenant } from "./seeds/demo-tenant.seed";

const db = new PrismaClient();

async function main() {
  await seedPermissions(db);
  await seedDemoTenant(db);
}

main()
  .then(async () => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
