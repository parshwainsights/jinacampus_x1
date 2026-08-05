import { z } from "zod";
import { idSchema } from "./shared";

const dateInput = z.coerce.date();
const reason = z.string().trim().min(10, "Provide at least 10 characters.").max(1000);
const remarks = z.string().trim().min(3).max(1000);
const optionalRemarks = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(1000).optional()
);

const leaveDateFields = {
  leaveTypeId: idSchema,
  startDate: dateInput,
  endDate: dateInput,
  duration: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]),
  reason
} as const;

function validateDateRange(
  value: { startDate: Date; endDate: Date; duration: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF" },
  ctx: z.RefinementCtx
) {
  if (value.endDate < value.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be on or after start date." });
  }
  if (value.startDate.getUTCFullYear() !== value.endDate.getUTCFullYear()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Submit separate applications for different calendar years." });
  }
  if (value.duration !== "FULL_DAY" && value.startDate.getTime() !== value.endDate.getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration"], message: "Half-day leave must use a single date." });
  }
}

export const createStaffLeaveApplicationSchema = z.object(leaveDateFields).strict().superRefine(validateDateRange);

export const updateStaffLeaveApplicationSchema = z.object({
  applicationId: idSchema,
  ...leaveDateFields,
  staffClarification: optionalRemarks
}).strict().superRefine(validateDateRange);

export const staffLeaveApplicationParamsSchema = z.object({ applicationId: idSchema }).strict();

export const staffLeaveReviewSchema = z.object({
  applicationId: idSchema,
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CLARIFICATION"]),
  remarks: optionalRemarks
}).strict().superRefine((value, ctx) => {
  if (value.decision !== "APPROVE" && !value.remarks) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["remarks"], message: "Remarks are required for this decision." });
  }
});

export const withdrawStaffLeaveSchema = z.object({
  applicationId: idSchema,
  remarks: optionalRemarks
}).strict();
export const cancelStaffLeaveSchema = z.object({
  applicationId: idSchema,
  remarks
}).strict();

export const staffLeaveSettingSchema = z.object({
  branchId: idSchema,
  allowHalfDay: z.boolean(),
  allowBackdatedApplications: z.boolean(),
  minimumNoticeDays: z.coerce.number().int().min(0).max(365),
  maximumConsecutiveDays: z.coerce.number().int().min(1).max(365),
  nonWorkingWeekdays: z.array(z.coerce.number().int().min(0).max(6)).max(6),
  approvalMode: z.enum(["PRINCIPAL_ONLY", "DESIGNATED_APPROVERS", "PRINCIPAL_OR_DESIGNATED"]),
  whatsappNotificationsEnabled: z.boolean()
}).strict();

export const upsertStaffLeaveTypeSchema = z.object({
  leaveTypeId: idSchema.optional(),
  branchId: idSchema,
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,24}$/),
  name: z.string().trim().min(2).max(80),
  isPaid: z.boolean(),
  balanceTracked: z.boolean(),
  annualLimit: z.coerce.number().min(0).max(366),
  carryForwardLimit: z.coerce.number().min(0).max(366),
  allowHalfDay: z.boolean(),
  supportingDocumentRequired: z.boolean(),
  documentRequiredAfterDays: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce.number().int().min(1).max(365).optional()
  ),
  isActive: z.boolean()
}).strict().superRefine((value, ctx) => {
  if (!value.balanceTracked && value.annualLimit !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["annualLimit"], message: "Untracked leave must use a zero annual limit." });
  }
  if (value.carryForwardLimit > value.annualLimit && value.balanceTracked) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["carryForwardLimit"], message: "Carry-forward cannot exceed the annual limit." });
  }
});

export const setStaffLeaveApproverSchema = z.object({
  branchId: idSchema,
  userId: idSchema,
  isActive: z.boolean()
}).strict();

export const adjustStaffLeaveBalanceSchema = z.object({
  branchId: idSchema,
  staffId: idSchema,
  leaveTypeId: idSchema,
  year: z.coerce.number().int().min(2000).max(2200),
  adjustmentDays: z.coerce.number().min(-366).max(366),
  reason
}).strict();

export const staffLeaveDocumentMetadataSchema = z.object({
  applicationId: idSchema,
  title: z.string().trim().min(2).max(120)
}).strict();

export const staffLeaveDocumentParamsSchema = z.object({
  applicationId: idSchema,
  documentId: idSchema
}).strict();

export const listStaffLeaveApplicationsSchema = z.object({
  status: z.enum(["PENDING", "CLARIFICATION_REQUIRED", "APPROVED", "REJECTED", "CANCELLED", "WITHDRAWN"]).optional(),
  branchId: idSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional()
}).strict();
