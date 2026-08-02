import { z } from "zod";
import { createStudentSchema } from "./student.schema";
import {
  dateSchema,
  emailSchema,
  idSchema,
  optionalDateSchema,
  optionalTrimmedString,
  phoneSchema
} from "./shared";

export const primaryGuardianRegistrationSchema = z.object({
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN"]),
  phone: phoneSchema,
  email: emailSchema,
  isEmergencyContact: z.boolean().default(true),
  hasPickupPermission: z.boolean().default(true)
}).strict();

export const initialClassAssignmentSchema = z.object({
  classSectionId: idSchema,
  rollNumber: optionalTrimmedString(40),
  enrolledOn: optionalDateSchema
}).strict();

export const createStudentRegistrationSchema = z.object({
  student: createStudentSchema,
  primaryGuardian: primaryGuardianRegistrationSchema,
  initialClassAssignment: initialClassAssignmentSchema.optional()
}).strict().superRefine((value, ctx) => {
  if (value.primaryGuardian.relation === "GUARDIAN" && !value.student.guardianName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter the guardian name when Other Guardian is selected.",
      path: ["student", "guardianName"]
    });
  }
});

export const assignStudentClassSchema = z.object({
  studentId: idSchema,
  classSectionId: idSchema,
  rollNumber: optionalTrimmedString(40),
  enrolledOn: dateSchema
}).strict();

export type CreateStudentRegistrationInput = z.infer<typeof createStudentRegistrationSchema>;
export type AssignStudentClassInput = z.infer<typeof assignStudentClassSchema>;
