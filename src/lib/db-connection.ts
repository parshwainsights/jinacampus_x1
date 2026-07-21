const SUPAVISOR_TRANSACTION_PORT = "6543";

export function getPrismaRuntimeDatabaseUrl(value = process.env.DATABASE_URL) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.port !== SUPAVISOR_TRANSACTION_PORT) return value;

    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    return url.toString();
  } catch {
    return value;
  }
}
