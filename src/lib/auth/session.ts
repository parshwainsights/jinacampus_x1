import { createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashSessionToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getSessionExpiresAt() {
  const date = new Date();
  date.setDate(date.getDate() + env.SESSION_TTL_DAYS);
  return date;
}
