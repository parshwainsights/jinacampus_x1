import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { NOTIFICATION_AUDIT_EVENTS } from "@/modules/notifications/audit-events";
import {
  communicationPreferenceOwnerSchema,
  updateCommunicationPreferenceSchema
} from "@/modules/notifications/schemas";

type CommunicationOwner = {
  branchId: string;
  registeredPhone: string | null;
};

async function resolveCommunicationOwner(
  ctx: TenantContext,
  ownerType: "GUARDIAN" | "STAFF",
  ownerId: string
): Promise<CommunicationOwner> {
  if (ownerType === "STAFF") {
    const staff = await db.staffProfile.findFirst({
      where: {
        id: ownerId,
        tenantId: ctx.tenantId,
        branchId: { in: ctx.accessibleBranchIds }
      },
      select: { branchId: true, phone: true }
    });
    if (!staff) throw notFound("STAFF_PROFILE_NOT_FOUND");
    return { branchId: staff.branchId, registeredPhone: staff.phone };
  }

  const preferredBranchIds = ctx.activeBranchId
    ? [ctx.activeBranchId, ...ctx.accessibleBranchIds.filter((id) => id !== ctx.activeBranchId)]
    : ctx.accessibleBranchIds;
  for (const branchId of preferredBranchIds) {
    const guardianLink = await db.studentGuardianLink.findFirst({
      where: {
        tenantId: ctx.tenantId,
        guardianId: ownerId,
        student: { tenantId: ctx.tenantId, branchId }
      },
      select: { guardian: { select: { phone: true } } }
    });
    if (guardianLink) return { branchId, registeredPhone: guardianLink.guardian.phone };
  }
  throw notFound("GUARDIAN_NOT_FOUND");
}

export async function getCommunicationPreference(
  ctx: TenantContext,
  input: unknown
) {
  const owner = communicationPreferenceOwnerSchema.parse(input);
  const resolved = await resolveCommunicationOwner(ctx, owner.ownerType, owner.ownerId);
  await requirePermission({
    ctx,
    permission: "notifications.settings.manage",
    branchId: resolved.branchId
  });
  const preference = await db.communicationPreference.findUnique({
    where: {
      tenantId_ownerType_ownerId: {
        tenantId: ctx.tenantId,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId
      }
    },
    select: {
      whatsappEnabled: true,
      whatsappNumber: true,
      attendanceAlertsEnabled: true,
      weeklySummaryEnabled: true,
      monthlySummaryEnabled: true,
      leaveUpdatesEnabled: true,
      consentCapturedAt: true,
      consentSource: true
    }
  });

  return {
    branchId: resolved.branchId,
    hasRegisteredPhone: Boolean(resolved.registeredPhone),
    preference
  };
}

export async function updateCommunicationPreference(
  ctx: TenantContext,
  input: unknown
) {
  const data = updateCommunicationPreferenceSchema.parse(input);
  const owner = await resolveCommunicationOwner(ctx, data.ownerType, data.ownerId);
  await requirePermission({
    ctx,
    permission: "notifications.settings.manage",
    branchId: owner.branchId
  });

  const attendanceAlertsEnabled = data.ownerType === "GUARDIAN" && data.attendanceAlertsEnabled;
  const weeklySummaryEnabled = data.ownerType === "STAFF" && data.weeklySummaryEnabled;
  const monthlySummaryEnabled = data.ownerType === "STAFF" && data.monthlySummaryEnabled;
  const leaveUpdatesEnabled = data.ownerType === "STAFF" && data.leaveUpdatesEnabled;
  const hasEnabledDelivery = data.whatsappEnabled && (
    attendanceAlertsEnabled || weeklySummaryEnabled || monthlySummaryEnabled || leaveUpdatesEnabled
  );
  const whatsappNumber = data.whatsappNumber ?? owner.registeredPhone;
  if (hasEnabledDelivery && !whatsappNumber) throw new Error("WHATSAPP_NUMBER_REQUIRED");
  const consentCapturedAt = hasEnabledDelivery && data.consentConfirmed ? new Date() : null;

  return db.$transaction(async (tx) => {
    const before = await tx.communicationPreference.findUnique({
      where: {
        tenantId_ownerType_ownerId: {
          tenantId: ctx.tenantId,
          ownerType: data.ownerType,
          ownerId: data.ownerId
        }
      }
    });
    const after = await tx.communicationPreference.upsert({
      where: {
        tenantId_ownerType_ownerId: {
          tenantId: ctx.tenantId,
          ownerType: data.ownerType,
          ownerId: data.ownerId
        }
      },
      create: {
        tenantId: ctx.tenantId,
        branchId: owner.branchId,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        whatsappEnabled: data.whatsappEnabled,
        whatsappNumber,
        attendanceAlertsEnabled,
        weeklySummaryEnabled,
        monthlySummaryEnabled,
        leaveUpdatesEnabled,
        consentCapturedAt,
        consentSource: consentCapturedAt ? "administrator_recorded" : null
      },
      update: {
        branchId: owner.branchId,
        whatsappEnabled: data.whatsappEnabled,
        whatsappNumber,
        attendanceAlertsEnabled,
        weeklySummaryEnabled,
        monthlySummaryEnabled,
        leaveUpdatesEnabled,
        consentCapturedAt,
        consentSource: consentCapturedAt ? "administrator_recorded" : null
      }
    });

    await writeAuditLog({
      ctx,
      action: NOTIFICATION_AUDIT_EVENTS.COMMUNICATION_PREFERENCE_UPDATED,
      entityType: "CommunicationPreference",
      entityId: after.id,
      branchId: owner.branchId,
      before: before ? {
        whatsappEnabled: before.whatsappEnabled,
        attendanceAlertsEnabled: before.attendanceAlertsEnabled,
        weeklySummaryEnabled: before.weeklySummaryEnabled,
        monthlySummaryEnabled: before.monthlySummaryEnabled,
        leaveUpdatesEnabled: before.leaveUpdatesEnabled,
        consentCaptured: Boolean(before.consentCapturedAt),
        hasWhatsAppNumber: Boolean(before.whatsappNumber)
      } : null,
      after: {
        ownerType: after.ownerType,
        whatsappEnabled: after.whatsappEnabled,
        attendanceAlertsEnabled: after.attendanceAlertsEnabled,
        weeklySummaryEnabled: after.weeklySummaryEnabled,
        monthlySummaryEnabled: after.monthlySummaryEnabled,
        leaveUpdatesEnabled: after.leaveUpdatesEnabled,
        consentCaptured: Boolean(after.consentCapturedAt),
        hasWhatsAppNumber: Boolean(after.whatsappNumber)
      }
    }, tx);
    return after;
  });
}
