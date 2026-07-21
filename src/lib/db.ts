import { PrismaClient } from "@prisma/client";
import { getPrismaRuntimeDatabaseUrl } from "@/lib/db-connection";

declare global {
  var __jinacampusPrisma: PrismaClient | undefined;
}

export const db =
  global.__jinacampusPrisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getPrismaRuntimeDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__jinacampusPrisma = db;
}
