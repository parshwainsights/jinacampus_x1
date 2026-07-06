import { z } from "zod";
import {
  idSchema,
  optionalDateSchema,
  optionalTrimmedString,
  paginationFields,
  searchSchema,
  staffAttendanceCorrectionStatusSchema,
  staffAttendanceStatusSchema,
  staffTypeSchema,
  trimmedString
} from "./shared";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function normalizeAttendanceDate(value: unknown) {
  if (value === null || value === "") return undefined;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!dateOnlyPattern.test(trimmed)) return trimmed;

  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDateOnly =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidDateOnly ? date : new Date(Number.NaN);
}

function dateRangeIsValid(value: { fromDate?: Date; toDate?: Date }) {
  if (!value.fromDate || !value.toDate) return true;
  return value.toDate >= value.fromDate;
}

function checkOutIsNotBeforeCheckIn(value: { checkInAt?: Date; checkOutAt?: Date }) {
  if (!value.checkInAt || !value.checkOutAt) return true;
  return value.checkOutAt >= value.checkInAt;
}

export const staffAttendanceDateSchema = z.preprocess(
  normalizeAttendanceDate,
  z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
    message: "Invalid attendance date"
  })
);

export { staffAttendanceStatusSchema };

export const correctStaffAttendanceSchema = z.object({
  attendanceRecordId: idSchema,
  status: staffAttendanceCorrectionStatusSchema,
  correctionReason: trimmedString(5, 500),
  checkInAt: optionalDateSchema,
  checkOutAt: optionalDateSchema
}).strict().refine(checkOutIsNotBeforeCheckIn, {
  message: "Check-out time must not be before check-in time",
  path: ["checkOutAt"]
});

export const listStaffAttendanceSchema = z.object({
  branchId: idSchema.optional(),
  date: staffAttendanceDateSchema.optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  staffId: idSchema.optional(),
  staffType: staffTypeSchema.optional(),
  status: staffAttendanceStatusSchema.optional(),
  department: optionalTrimmedString(120),
  search: searchSchema,
  ...paginationFields
}).strict().refine(dateRangeIsValid, {
  message: "To date must not be before from date",
  path: ["toDate"]
});

export const staffAttendanceReportFilterSchema = listStaffAttendanceSchema;

export const staffDailyAttendanceReportFilterSchema = z.object({
  branchId: idSchema.optional(),
  date: staffAttendanceDateSchema.optional(),
  staffType: staffTypeSchema.optional(),
  status: staffAttendanceStatusSchema.optional(),
  department: optionalTrimmedString(120),
  search: searchSchema,
  ...paginationFields
}).strict();

export const staffDateRangeAttendanceReportFilterSchema = z.object({
  branchId: idSchema.optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  staffType: staffTypeSchema.optional(),
  status: staffAttendanceStatusSchema.optional(),
  department: optionalTrimmedString(120),
  search: searchSchema,
  ...paginationFields
}).strict().refine(dateRangeIsValid, {
  message: "To date must not be before from date",
  path: ["toDate"]
});

export const staffMonthlyAttendanceSummaryFilterSchema = z.object({
  branchId: idSchema.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  staffType: staffTypeSchema.optional(),
  department: optionalTrimmedString(120),
  search: searchSchema,
  ...paginationFields
}).strict();

export const staffCorrectionReportFilterSchema = staffDateRangeAttendanceReportFilterSchema;

export type CorrectStaffAttendanceInput = z.infer<typeof correctStaffAttendanceSchema>;
export type ListStaffAttendanceInput = z.infer<typeof listStaffAttendanceSchema>;
export type StaffAttendanceReportFilterInput = z.infer<typeof staffAttendanceReportFilterSchema>;
export type StaffDailyAttendanceReportFilterInput = z.infer<typeof staffDailyAttendanceReportFilterSchema>;
export type StaffDateRangeAttendanceReportFilterInput = z.infer<typeof staffDateRangeAttendanceReportFilterSchema>;
export type StaffMonthlyAttendanceSummaryFilterInput = z.infer<typeof staffMonthlyAttendanceSummaryFilterSchema>;
export type StaffCorrectionReportFilterInput = z.infer<typeof staffCorrectionReportFilterSchema>;
