import { PrismaClient } from "@prisma/client";
import { resetDemoQaState } from "./seeds/demo-qa-reset.seed";

const db = new PrismaClient();

async function main() {
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
