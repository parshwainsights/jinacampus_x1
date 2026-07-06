import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().default("jc_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  PASSWORD_PEPPER: z.string().min(16),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
