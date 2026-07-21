import { PrismaClient } from "@prisma/client";
import { seedCommercialBootstrap } from "./seeds/bootstrap-commercial.seed";
import { seedDevDemo } from "./seeds/dev-demo.seed";
import { seedPermissions } from "./seeds/permissions.seed";

const db = new PrismaClient();

async function main() {
  await seedPermissions(db);
  await seedCommercialBootstrap(db);
  await seedDevDemo(db);
}

main()
  .then(async () => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
