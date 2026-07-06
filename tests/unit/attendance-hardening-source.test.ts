import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("attendance hardening source guards", () => {
  it("queues student attendance WhatsApp notifications without direct outbox writes", () => {
    const source = readProjectFile("src/modules/academia/services/student-attendance.service.ts");

    expect(source).toContain("queueStudentAttendanceWhatsAppNotifications");
    expect(source).toContain("attendanceRecordIds");
    expect(source).toContain(".catch(() => null)");
    expect(source).not.toMatch(/notificationOutbox\.(create|createMany|upsert)/i);
    expect(source).not.toMatch(/domainEventOutbox\.(create|createMany|upsert)/i);
  });
});
