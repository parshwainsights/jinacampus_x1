import { z } from "zod";

export const createTenantSchema = z.object({
  code: z.string().min(2).max(30).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(2).max(120),
});

export const createInstitutionSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(30),
  boardName: z.string().max(100).optional(),
});

export const createBranchSchema = z.object({
  institutionId: z.string().cuid(),
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(30),
  timezone: z.string().default("Asia/Kolkata"),
});

export const createAcademicYearSchema = z.object({
  branchId: z.string().cuid(),
  name: z.string().min(4).max(40),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(250).optional(),
  permissionKeys: z.array(z.string()).min(1),
});

export const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  branchId: z.string().cuid().optional(),
});

export const updateTenantSettingsSchema = z.object({
  appName: z.string().min(2).max(100),
  locale: z.string().min(2).max(20),
  currency: z.string().length(3),
});

export const updateAttendanceSettingsSchema = z.object({
  branchId: z.string().cuid(),
  studentAttendanceMode: z.enum(["DAILY"]),
  studentDefaultSessionType: z.enum(["FULL_DAY", "MORNING", "AFTERNOON", "PERIOD"]),
  studentAutoLockEnabled: z.boolean(),
  studentAutoLockTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  sendStudentAbsentAlert: z.boolean(),
  sendStudentLateAlert: z.boolean(),
  minimumAttendancePercentage: z.number().min(0).max(100),
  staffQrAttendanceEnabled: z.boolean(),
  staffCheckInStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  staffLateAfterTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  staffHalfDayBeforeMinutes: z.number().int().min(1),
  staffMinimumWorkingMinutes: z.number().int().min(1),
  staffQrTokenValiditySeconds: z.number().int().min(30).max(600),
});
