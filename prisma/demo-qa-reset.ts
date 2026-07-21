import { PrismaClient } from "@prisma/client";
import { resetDemoQaState } from "./seeds/demo-qa-reset.seed";
import { assertDevDemoSeedAllowed } from "./seeds/dev-demo.seed";

const db = new PrismaClient();

async function main() {
  if (!assertDevDemoSeedAllowed()) {
    throw new Error("Development fixture reset requires DEV_DEMO_SEED_ENABLED=true.");
  }
  const summary = await resetDemoQaState(db);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .then(async () => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
