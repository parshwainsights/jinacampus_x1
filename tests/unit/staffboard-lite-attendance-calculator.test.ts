import { describe, expect, it } from "vitest";
import {
  calculateCheckInStatus,
  calculateCheckOutStatus,
  calculateFinalAttendanceStatus,
  calculateWorkingMinutes,
  resolveStaffAttendanceCalculationSettings
} from "@/modules/staffboard-lite/utils/attendance-calculator";

const settings = {
  staffLateAfterTime: "09:30",
  staffHalfDayBeforeMinutes: 240,
  staffMinimumWorkingMinutes: 480,
  timeZone: "Asia/Kolkata"
};

describe("StaffBoard Lite attendance calculator", () => {
  it("marks on-time check-in as PRESENT", () => {
    expect(calculateCheckInStatus({
      checkInAt: new Date("2026-05-05T03:59:00.000Z"),
      settings
    })).toBe("PRESENT");
  });

  it("marks late check-in as LATE", () => {
    expect(calculateCheckInStatus({
      checkInAt: new Date("2026-05-05T04:01:00.000Z"),
      settings
    })).toBe("LATE");
  });

  it("uses exact check-in threshold boundaries deterministically", () => {
    expect(calculateCheckInStatus({
      checkInAt: new Date("2026-05-05T04:00:00.000Z"),
      settings
    })).toBe("PRESENT");
    expect(calculateCheckInStatus({
      checkInAt: new Date("2026-05-05T04:00:00.001Z"),
      settings
    })).toBe("LATE");
  });

  it("calculates non-negative working minutes", () => {
    expect(calculateWorkingMinutes(
      new Date("2026-05-05T02:30:30.000Z"),
      new Date("2026-05-05T10:30:29.000Z")
    )).toBe(479);
    expect(calculateWorkingMinutes(
      new Date("2026-05-05T10:30:00.000Z"),
      new Date("2026-05-05T02:30:00.000Z")
    )).toBe(0);
  });

  it("marks short working time as HALF_DAY", () => {
    expect(calculateCheckOutStatus({ workingMinutes: 120, settings })).toBe("HALF_DAY");
  });

  it("marks full working time as PRESENT", () => {
    expect(calculateCheckOutStatus({ workingMinutes: 480, settings })).toBe("PRESENT");
  });

  it("keeps intermediate working time as HALF_DAY until full-day threshold is reached", () => {
    expect(calculateCheckOutStatus({ workingMinutes: 240, settings })).toBe("HALF_DAY");
    expect(calculateCheckOutStatus({ workingMinutes: 479, settings })).toBe("HALF_DAY");
    expect(calculateCheckOutStatus({ workingMinutes: 480, settings })).toBe("PRESENT");
  });

  it("uses fallback settings when AttendanceSetting values are missing or invalid", () => {
    expect(resolveStaffAttendanceCalculationSettings({
      staffLateAfterTime: "invalid",
      staffHalfDayBeforeMinutes: null,
      staffMinimumWorkingMinutes: -1,
      timeZone: "Bad/Zone"
    })).toEqual({
      staffLateAfterTime: "09:30",
      staffHalfDayBeforeMinutes: 240,
      staffMinimumWorkingMinutes: 480,
      timeZone: "Asia/Kolkata"
    });
    expect(calculateCheckInStatus({ checkInAt: new Date("2026-05-05T04:01:00.000Z") })).toBe("LATE");
    expect(calculateCheckOutStatus({ workingMinutes: 480 })).toBe("PRESENT");
  });

  it("respects configured full-day minutes and only falls back to 480 when no setting is supplied", () => {
    const prismaDefaultSettings = resolveStaffAttendanceCalculationSettings({
      staffLateAfterTime: "09:30",
      staffHalfDayBeforeMinutes: 240,
      staffMinimumWorkingMinutes: 360,
      timeZone: "Asia/Kolkata"
    });

    expect(prismaDefaultSettings.staffMinimumWorkingMinutes).toBe(360);
    expect(calculateCheckOutStatus({
      workingMinutes: 359,
      settings: prismaDefaultSettings
    })).toBe("HALF_DAY");
    expect(calculateCheckOutStatus({
      workingMinutes: 360,
      settings: prismaDefaultSettings
    })).toBe("PRESENT");

    expect(resolveStaffAttendanceCalculationSettings({
      staffLateAfterTime: "09:30",
      staffHalfDayBeforeMinutes: 240,
      staffMinimumWorkingMinutes: null,
      timeZone: "Asia/Kolkata"
    }).staffMinimumWorkingMinutes).toBe(480);
  });

  it("prioritizes check-out status in final status calculation", () => {
    expect(calculateFinalAttendanceStatus({ checkInStatus: "LATE", checkOutStatus: "PRESENT" })).toBe("PRESENT");
    expect(calculateFinalAttendanceStatus({ checkInStatus: "PRESENT", checkOutStatus: "HALF_DAY" })).toBe("HALF_DAY");
    expect(calculateFinalAttendanceStatus({ checkInStatus: "LATE" })).toBe("LATE");
    expect(calculateFinalAttendanceStatus({})).toBe("PRESENT");
  });
});
