import { describe, expect, it } from "vitest";
import {
  createClassSectionSchema,
  createEnrollmentSchema,
  createGuardianSchema,
  createStudentSchema,
  linkGuardianSchema,
  updateClassSchema,
  updateStudentSchema
} from "@/modules/academia/schemas";

const branchId = "00000000-0000-0000-0000-000000000001";
const academicYearId = "00000000-0000-0000-0000-000000000002";
const classId = "00000000-0000-0000-0000-000000000003";
const sectionId = "00000000-0000-0000-0000-000000000004";
const classSectionId = "00000000-0000-0000-0000-000000000005";
const studentId = "00000000-0000-0000-0000-000000000006";
const guardianId = "00000000-0000-0000-0000-000000000007";

function validStudentInput() {
  return {
    branchId,
    admissionNumber: "ADM-1001",
    admissionDate: "2026-04-01",
    fullName: "Aarav Shah",
    dateOfBirth: "2018-01-10",
    fatherName: "Nilesh Shah",
    motherName: "Kavita Shah",
    aadhaarNumber: "1234 1234 1234",
    religion: "Hindu",
    caste: "General",
    category: "General",
    nationality: "India",
    city: "Ahmedabad",
    state: "Gujarat"
  };
}

describe("Academia schemas", () => {
  it("accepts valid create student input", () => {
    const result = createStudentSchema.safeParse({
      ...validStudentInput(),
      lastName: "Shah",
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      pincode: "380015",
      bankAccountNumber: "123456789012",
      ifscCode: "hdfc0001234",
      joinedAt: "2026-04-01"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aadhaarNumber).toBe("123412341234");
      expect(result.data.ifscCode).toBe("HDFC0001234");
    }
  });

  it("rejects create student input without required admission-sheet fields", () => {
    const result = createStudentSchema.safeParse({
      branchId,
      admissionNumber: "ADM-1001",
      fullName: "Aarav Shah"
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields on strict student input", () => {
    const result = createStudentSchema.safeParse({
      ...validStudentInput(),
      tenantId: "00000000-0000-0000-0000-000000000099",
    });

    expect(result.success).toBe(false);
  });

  it("validates sensitive student identity and bank fields", () => {
    expect(createStudentSchema.safeParse({
      ...validStudentInput(),
      aadhaarNumber: "12345"
    }).success).toBe(false);

    expect(createStudentSchema.safeParse({
      ...validStudentInput(),
      pincode: "1234"
    }).success).toBe(false);

    expect(createStudentSchema.safeParse({
      ...validStudentInput(),
      bankAccountNumber: "abc123"
    }).success).toBe(false);
  });

  it("rejects invalid guardian email", () => {
    const result = createGuardianSchema.safeParse({
      firstName: "Meera",
      email: "not-an-email"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid guardian phone", () => {
    const result = createGuardianSchema.safeParse({
      firstName: "Meera",
      phone: "12345"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid create class-section input", () => {
    const result = createClassSectionSchema.safeParse({
      branchId,
      academicYearId,
      classId,
      sectionId,
      displayName: "Class 1 - A",
      capacity: 45
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid create enrollment input", () => {
    const result = createEnrollmentSchema.safeParse({
      branchId,
      academicYearId,
      studentId,
      classSectionId,
      rollNumber: "12",
      enrolledOn: "2026-04-01"
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid student guardian link input", () => {
    const result = linkGuardianSchema.safeParse({
      studentId,
      guardianId,
      relation: "FATHER",
      isPrimary: true,
      isEmergencyContact: true,
      hasPickupPermission: true
    });

    expect(result.success).toBe(true);
  });

  it("allows partial safe updates", () => {
    expect(updateStudentSchema.safeParse({
      studentId,
      status: "TRANSFERRED"
    }).success).toBe(true);

    expect(updateClassSchema.safeParse({
      classId,
      name: "Class 1"
    }).success).toBe(true);
  });

  it("rejects empty update payloads", () => {
    const result = updateStudentSchema.safeParse({ studentId });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields on class-section input", () => {
    const result = createClassSectionSchema.safeParse({
      branchId,
      academicYearId,
      classId,
      sectionId,
      guardianId,
      displayName: "Class 1 - A"
    });

    expect(result.success).toBe(false);
  });
});
