import { describe, expect, it } from "vitest";
import {
  correctStudentAttendanceSchema,
  dailyAttendanceReportFilterSchema,
  lockStudentAttendanceSchema,
  monthlyAttendancePercentageFilterSchema,
  studentAttendanceReportFilterSchema,
  submitStudentAttendanceSchema
} from "@/modules/academia/schemas";

const classSectionId = "00000000-0000-0000-0000-000000000001";
const studentOneId = "00000000-0000-0000-0000-000000000002";
const studentTwoId = "00000000-0000-0000-0000-000000000003";
const attendanceRecordId = "00000000-0000-0000-0000-000000000004";

describe("Student attendance schemas", () => {
  it("accepts valid attendance submission with multiple students", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: [
        { studentId: studentOneId, status: "PRESENT" },
        { studentId: studentTwoId, status: "ABSENT", remarks: "Informed by parent" }
      ]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionType).toBe("FULL_DAY");
    }
  });

  it("rejects empty entries array", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate studentId values in entries", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: [
        { studentId: studentOneId, status: "PRESENT" },
        { studentId: studentOneId, status: "ABSENT" }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid attendance status", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: [{ studentId: studentOneId, status: "UNKNOWN" }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects NOT_MARKED as a submitted status", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: [{ studentId: studentOneId, status: "NOT_MARKED" }]
    });

    expect(result.success).toBe(false);
  });

  it("trims remarks", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      entries: [{ studentId: studentOneId, status: "LATE", remarks: "  Bus delay  " }]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entries[0].remarks).toBe("Bus delay");
    }
  });

  it("requires correctionReason for correction", () => {
    const result = correctStudentAttendanceSchema.safeParse({
      attendanceRecordId,
      status: "EXCUSED"
    });

    expect(result.success).toBe(false);
  });

  it("rejects short or blank correctionReason", () => {
    expect(correctStudentAttendanceSchema.safeParse({
      attendanceRecordId,
      status: "EXCUSED",
      correctionReason: "   "
    }).success).toBe(false);

    expect(correctStudentAttendanceSchema.safeParse({
      attendanceRecordId,
      status: "EXCUSED",
      correctionReason: "Fix"
    }).success).toBe(false);
  });

  it("rejects unknown sensitive fields", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      tenantId: "00000000-0000-0000-0000-000000000099",
      branchId: "00000000-0000-0000-0000-000000000098",
      academicYearId: "00000000-0000-0000-0000-000000000097",
      markedById: "00000000-0000-0000-0000-000000000096",
      entries: [{ studentId: studentOneId, status: "PRESENT" }]
    });

    expect(result.success).toBe(false);
  });

  it("accepts NOT_MARKED for future report filtering only", () => {
    const result = studentAttendanceReportFilterSchema.safeParse({
      classSectionId,
      fromDate: "2026-04-01",
      toDate: "2026-04-30",
      status: "NOT_MARKED"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid date-only attendance values", () => {
    const result = submitStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-02-31",
      entries: [{ studentId: studentOneId, status: "PRESENT" }]
    });

    expect(result.success).toBe(false);
  });

  it("defines a strict lock schema without actor fields", () => {
    expect(lockStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03",
      lockedAt: "2026-04-03T15:00:00.000Z"
    }).success).toBe(false);

    expect(lockStudentAttendanceSchema.safeParse({
      classSectionId,
      attendanceDate: "2026-04-03"
    }).success).toBe(true);
  });

  it("defines strict daily report filters without tenant scope input", () => {
    expect(dailyAttendanceReportFilterSchema.safeParse({
      attendanceDate: "2026-04-03",
      classSectionId,
      status: "ABSENT"
    }).success).toBe(true);

    expect(dailyAttendanceReportFilterSchema.safeParse({
      attendanceDate: "2026-04-03",
      tenantId: "00000000-0000-0000-0000-000000000099"
    }).success).toBe(false);
  });

  it("coerces monthly percentage report month and year filters", () => {
    const result = monthlyAttendancePercentageFilterSchema.safeParse({
      classSectionId,
      month: "4",
      year: "2026"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.month).toBe(4);
      expect(result.data.year).toBe(2026);
    }
  });
});
