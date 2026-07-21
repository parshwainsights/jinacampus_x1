import { validateEnvironment } from "@/lib/env-validation";

export const env = validateEnvironment(process.env);
