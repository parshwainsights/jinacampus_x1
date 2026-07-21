import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function databaseErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return "UNKNOWN";
  return typeof error.code === "string" ? error.code : "UNKNOWN";
}

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Database health check failed.", { code: databaseErrorCode(error) });
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 500 });
  }
}
