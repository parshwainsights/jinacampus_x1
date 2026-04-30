import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/core/auth/tenant-context";
import { AppError } from "@/core/errors/http";
import { createTenantService } from "@/modules/campus-core/services";

async function getSessionLike(_req: NextRequest) {
  return { user: { id: "dev-user", tenantId: "dev-tenant" } };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionLike(req);
    const ctx = resolveTenantContext(session);
    const body = await req.json();
    const result = await createTenantService({
      actorUserId: ctx.userId,
      tenantId: ctx.tenantId,
      payload: body,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
