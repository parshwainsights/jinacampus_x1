import { PrismaClient } from "@prisma/client";

declare global {
  var __jinacampusPrisma: PrismaClient | undefined;
}

export const db =
  global.__jinacampusPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__jinacampusPrisma = db;
}
