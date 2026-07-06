import { z } from "zod";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeDashboardDate(value: unknown) {
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

export const dashboardDateSchema = z.preprocess(
  normalizeDashboardDate,
  z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
    message: "Invalid dashboard date"
  })
);

export const dashboardDateFilterSchema = z.object({
  date: dashboardDateSchema.optional(),
  branchId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional())
}).strict();

export const dashboardSummaryFilterSchema = dashboardDateFilterSchema;

export type DashboardDateFilterInput = z.infer<typeof dashboardDateFilterSchema>;
export type DashboardSummaryFilterInput = z.infer<typeof dashboardSummaryFilterSchema>;
