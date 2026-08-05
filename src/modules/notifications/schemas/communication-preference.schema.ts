import { z } from "zod";

const optionalPhone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().min(8).max(20).regex(/^\+?[0-9]+$/, "Use a country code and digits only.").nullable()
);

export const updateCommunicationPreferenceSchema = z.object({
  ownerType: z.enum(["GUARDIAN", "STAFF"]),
  ownerId: z.string().uuid(),
  whatsappEnabled: z.boolean().default(false),
  whatsappNumber: optionalPhone,
  attendanceAlertsEnabled: z.boolean().default(false),
  weeklySummaryEnabled: z.boolean().default(false),
  monthlySummaryEnabled: z.boolean().default(false),
  leaveUpdatesEnabled: z.boolean().default(false),
  consentConfirmed: z.boolean().default(false)
}).strict().superRefine((value, ctx) => {
  const deliveryEnabled = value.whatsappEnabled && (
    value.attendanceAlertsEnabled || value.weeklySummaryEnabled || value.monthlySummaryEnabled || value.leaveUpdatesEnabled
  );
  if (deliveryEnabled && !value.consentConfirmed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Confirm that WhatsApp consent has been recorded.",
      path: ["consentConfirmed"]
    });
  }
  if (value.ownerType === "GUARDIAN" && (value.weeklySummaryEnabled || value.monthlySummaryEnabled)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Guardian preferences support student attendance notifications only.",
      path: ["ownerType"]
    });
  }
  if (value.ownerType === "GUARDIAN" && value.leaveUpdatesEnabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Guardian preferences do not support staff leave updates.",
      path: ["ownerType"]
    });
  }
  if (value.ownerType === "STAFF" && value.attendanceAlertsEnabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Staff preferences support weekly and monthly attendance reports only.",
      path: ["ownerType"]
    });
  }
});

export const communicationPreferenceOwnerSchema = z.object({
  ownerType: z.enum(["GUARDIAN", "STAFF"]),
  ownerId: z.string().uuid()
}).strict();
