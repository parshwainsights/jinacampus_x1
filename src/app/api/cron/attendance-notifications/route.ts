import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runAttendanceNotificationScheduler } from "@/modules/notifications/jobs/attendance-notification-scheduler.job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValidCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const received = authorization.slice("Bearer ".length);
  const expectedBytes = Buffer.from(secret);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Notification scheduler is not configured." }, { status: 503 });
  }
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ success: false, error: "Unauthenticated." }, { status: 401 });
  }

  const result = await runAttendanceNotificationScheduler();
  return NextResponse.json({ success: true, result });
}
