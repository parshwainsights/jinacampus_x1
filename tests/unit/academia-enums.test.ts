import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

function getEnumValues(enumName: string) {
  const match = new RegExp(`enum ${enumName} \\{([\\s\\S]*?)\\n\\}`).exec(schema);
  if (!match) throw new Error(`Missing Prisma enum: ${enumName}`);
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("Academia enum coverage", () => {
  it("covers student lifecycle status", () => {
    expect(getEnumValues("StudentStatus")).toEqual(["ACTIVE", "INACTIVE", "ALUMNI", "TRANSFERRED", "WITHDRAWN"]);
  });

  it("covers enrollment outcomes", () => {
    expect(getEnumValues("EnrollmentStatus")).toEqual([
      "ACTIVE",
      "PROMOTED",
      "TRANSFERRED",
      "WITHDRAWN",
      "CANCELLED",
      "COMPLETED"
    ]);
  });

  it("covers guardian relationship values", () => {
    expect(getEnumValues("GuardianRelation")).toEqual([
      "FATHER",
      "MOTHER",
      "GUARDIAN",
      "GRANDFATHER",
      "GRANDMOTHER",
      "UNCLE",
      "AUNT",
      "SIBLING",
      "OTHER"
    ]);
  });

  it("covers student demographics and subject type", () => {
    expect(getEnumValues("Gender")).toEqual(["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"]);
    expect(getEnumValues("BloodGroup")).toContain("O_NEGATIVE");
    expect(getEnumValues("SubjectType")).toEqual(["CORE", "ELECTIVE", "OPTIONAL", "CO_CURRICULAR"]);
  });

  it("keeps attendance MVP enums ready for full-day attendance", () => {
    expect(getEnumValues("AttendanceSessionType")).toContain("FULL_DAY");
    expect(getEnumValues("StudentAttendanceStatus")).toEqual([
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY",
      "ON_LEAVE",
      "EXCUSED",
      "NOT_MARKED"
    ]);
  });
});
