import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  dateOnlyStringInTimeZone,
  hasReachedLocalTime,
  isValidTimeZone,
  previousCalendarMonth,
  previousCompletedDaysRange,
  safeTimeZone
} from "@/lib/dates/time-zone";
import {
  institutionalDateTimeLocalToIso,
  toDateTimeLocalValue
} from "@/modules/staffboard-lite/components/attendance/staff-attendance-admin-state";

describe("institutional time-zone handling", () => {
  it("derives the institutional calendar day from the configured IANA zone", () => {
    const instant = new Date("2026-04-01T20:00:00.000Z");

    expect(dateOnlyStringInTimeZone(instant, "Asia/Kolkata")).toBe("2026-04-02");
    expect(dateOnlyStringInTimeZone(instant, "America/New_York")).toBe("2026-04-01");
    expect(hasReachedLocalTime(instant, "Asia/Kolkata", "01:00")).toBe(true);
  });

  it("falls back safely and computes completed local reporting periods", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Not/A-Time-Zone")).toBe(false);
    expect(safeTimeZone("Not/A-Time-Zone")).toBe("Asia/Kolkata");

    const range = previousCompletedDaysRange(new Date("2026-04-02T01:00:00.000Z"), "Asia/Kolkata", 7);
    expect(range.startDate.toISOString().slice(0, 10)).toBe("2026-03-26");
    expect(range.endDate.toISOString().slice(0, 10)).toBe("2026-04-01");

    expect(previousCalendarMonth(new Date("2026-01-01T00:30:00.000Z"), "America/Los_Angeles"))
      .toEqual({ year: 2025, month: 11 });
  });

  it("round-trips staff correction inputs through the institution zone", () => {
    const instant = "2026-04-01T03:30:00.000Z";
    const localValue = toDateTimeLocalValue(instant, "Asia/Kolkata");

    expect(localValue).toBe("2026-04-01T09:00");
    expect(institutionalDateTimeLocalToIso(localValue, "Asia/Kolkata")).toBe(instant);
  });

  it("protects the scheduler route with a server-side cron secret", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/cron/attendance-notifications/route.ts"),
      "utf8"
    );
    const scheduler = readFileSync(
      resolve(process.cwd(), "src/modules/notifications/jobs/attendance-notification-scheduler.job.ts"),
      "utf8"
    );

    expect(route).toContain("CRON_SECRET");
    expect(route).toContain("timingSafeEqual");
    expect(route).toContain("status: 401");
    expect(scheduler).toContain("tenantId: setting.tenantId");
    expect(scheduler).toContain("branchId: setting.branchId");
    expect(scheduler).toContain("previousCompletedDaysRange");
    expect(scheduler).toContain("previousCalendarMonth");
  });
});
