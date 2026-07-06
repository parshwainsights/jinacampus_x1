import { createHash, randomBytes } from "node:crypto";
import type { StaffAttendanceStatus, StaffQrPurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import { writeAuditLog } from "@/lib/audit/audit-log";
import type { TenantContext } from "@/lib/tenant/context";
import { STAFFBOARD_LITE_AUDIT_EVENTS } from "@/modules/staffboard-lite/audit-events";
import { generateStaffQrSchema, scanStaffQrSchema } from "@/modules/staffboard-lite/schemas";
import {
  calculateCheckInStatus,
  calculateCheckOutStatus,
  calculateFinalAttendanceStatus,
  calculateWorkingMinutes,
  resolveStaffAttendanceCalculationSettings
} from "@/modules/staffboard-lite/utils/attendance-calculator";
import { conflict, ensureActiveBranch, requireBranchPermission, validationError } from "./shared";

const STAFF_ATTENDANCE_QR_PAYLOAD_TYPE = "STAFF_ATTENDANCE_QR";
const DEFAULT_QR_TOKEN_VALIDITY_SECONDS = 180;
const MIN_QR_TOKEN_VALIDITY_SECONDS = 30;
const MAX_QR_TOKEN_VALIDITY_SECONDS = 900;

export type GenerateStaffAttendanceQrTokenResult = {
  qrTokenId: string;
  purpose: StaffQrPurpose;
  branchId: string;
  validFrom: string;
  validUntil: string;
  expiresInSeconds: number;
  qrPayload: string;
};

export type ScanStaffAttendanceQrResult = {
  success: true;
  purpose: StaffQrPurpose;
  attendanceDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  workingMinutes?: number;
  status: StaffAttendanceStatus;
  message: string;
};

export function hashStaffAttendanceQrToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function generateRawQrToken() {
  return randomBytes(32).toString("base64url");
}

function buildQrPayload(rawToken: string) {
  return JSON.stringify({ type: STAFF_ATTENDANCE_QR_PAYLOAD_TYPE, token: rawToken });
}

function resolveQrBranchId(ctx: TenantContext, inputBranchId?: string) {
  if (inputBranchId) return inputBranchId;
  if (ctx.activeBranchId) return ctx.activeBranchId;
  if (ctx.accessibleBranchIds.length === 1) return ctx.accessibleBranchIds[0];
  throw validationError("STAFF_QR_BRANCH_REQUIRED");
}

function resolveValiditySeconds(inputValidity: number | undefined, settingValidity: number | undefined) {
  const expiresInSeconds = inputValidity ?? settingValidity ?? DEFAULT_QR_TOKEN_VALIDITY_SECONDS;

  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < MIN_QR_TOKEN_VALIDITY_SECONDS ||
    expiresInSeconds > MAX_QR_TOKEN_VALIDITY_SECONDS
  ) {
    throw validationError("INVALID_STAFF_QR_TOKEN_VALIDITY_SECONDS");
  }

  return expiresInSeconds;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(valueByType.get("year")),
    month: Number(valueByType.get("month")),
    day: Number(valueByType.get("day")),
    hour: Number(valueByType.get("hour")),
    minute: Number(valueByType.get("minute")),
    second: Number(valueByType.get("second"))
  };
}

function attendanceDateForBranch(now: Date, timeZone: string) {
  const parts = zonedParts(now, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function scanMessage(purpose: StaffQrPurpose) {
  return purpose === "CHECK_IN" ? "Check-in successful" : "Check-out successful";
}

export async function generateStaffAttendanceQrToken(
  ctx: TenantContext,
  input: unknown
): Promise<GenerateStaffAttendanceQrTokenResult> {
  const data = generateStaffQrSchema.parse(input);
  const branchId = resolveQrBranchId(ctx, data.branchId);

  await requireBranchPermission(ctx, "staffboard.attendance.qr.generate", branchId);

  return db.$transaction(async (tx) => {
    await ensureActiveBranch(tx, ctx, branchId);

    const attendanceSetting = await tx.attendanceSetting.findFirst({
      where: { tenantId: ctx.tenantId, branchId },
      select: {
        staffQrAttendanceEnabled: true,
        staffQrTokenValiditySeconds: true
      }
    });

    if (attendanceSetting?.staffQrAttendanceEnabled === false) {
      throw new AppError("STAFF_QR_ATTENDANCE_DISABLED", "STAFF_QR_ATTENDANCE_DISABLED", 403);
    }

    const expiresInSeconds = resolveValiditySeconds(data.validForSeconds, attendanceSetting?.staffQrTokenValiditySeconds);
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + expiresInSeconds * 1000);
    const rawToken = generateRawQrToken();
    const tokenHash = hashStaffAttendanceQrToken(rawToken);

    const qrToken = await tx.staffAttendanceQrToken.create({
      data: {
        tenantId: ctx.tenantId,
        branchId,
        tokenHash,
        purpose: data.purpose,
        validFrom,
        validUntil,
        consumedCount: 0,
        createdById: ctx.userId
      },
      select: {
        id: true,
        purpose: true,
        branchId: true,
        validFrom: true,
        validUntil: true
      }
    });

    await writeAuditLog({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_ATTENDANCE_QR_GENERATED,
      entityType: "StaffAttendanceQrToken",
      entityId: qrToken.id,
      branchId,
      metadata: {
        tenantId: ctx.tenantId,
        branchId,
        actorUserId: ctx.userId,
        qrTokenId: qrToken.id,
        purpose: qrToken.purpose,
        validFrom: qrToken.validFrom.toISOString(),
        validUntil: qrToken.validUntil.toISOString(),
        expiresInSeconds
      }
    }, tx);

    return {
      qrTokenId: qrToken.id,
      purpose: qrToken.purpose,
      branchId: qrToken.branchId,
      validFrom: qrToken.validFrom.toISOString(),
      validUntil: qrToken.validUntil.toISOString(),
      expiresInSeconds,
      qrPayload: buildQrPayload(rawToken)
    };
  });
}

export async function scanStaffAttendanceQr(
  ctx: TenantContext,
  input: unknown
): Promise<ScanStaffAttendanceQrResult> {
  const data = scanStaffQrSchema.parse(input);
  const tokenHash = hashStaffAttendanceQrToken(data.token);
  const now = new Date();

  if (!ctx.userId) throw validationError("ACTOR_REQUIRED");

  return db.$transaction(async (tx) => {
    const staffProfile = await tx.staffProfile.findFirst({
      where: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        employmentStatus: "ACTIVE"
      },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        branch: { select: { id: true, timezone: true, status: true } }
      }
    });
    if (!staffProfile) throw validationError("ACTIVE_STAFF_PROFILE_NOT_FOUND");
    if (staffProfile.branch.status === "ARCHIVED") throw validationError("STAFF_BRANCH_INACTIVE");

    await requirePermission({ ctx, permission: "staffboard.attendance.self_scan", branchId: staffProfile.branchId });

    const qrToken = await tx.staffAttendanceQrToken.findFirst({
      where: {
        tenantId: ctx.tenantId,
        tokenHash
      },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        purpose: true,
        validFrom: true,
        validUntil: true
      }
    });
    if (!qrToken) throw validationError("INVALID_STAFF_QR");
    if (qrToken.validFrom > now || qrToken.validUntil < now) {
      throw validationError("STAFF_QR_EXPIRED");
    }
    if (qrToken.branchId !== staffProfile.branchId) {
      throw new AppError("STAFF_QR_BRANCH_MISMATCH", "STAFF_QR_BRANCH_MISMATCH", 403);
    }

    const attendanceSetting = await tx.attendanceSetting.findFirst({
      where: { tenantId: ctx.tenantId, branchId: staffProfile.branchId },
      select: {
        staffQrAttendanceEnabled: true,
        staffLateAfterTime: true,
        staffHalfDayBeforeMinutes: true,
        staffMinimumWorkingMinutes: true
      }
    });
    if (attendanceSetting?.staffQrAttendanceEnabled === false) {
      throw new AppError("STAFF_QR_ATTENDANCE_DISABLED", "STAFF_QR_ATTENDANCE_DISABLED", 403);
    }

    const calculationSettings = resolveStaffAttendanceCalculationSettings({
      staffLateAfterTime: attendanceSetting?.staffLateAfterTime,
      staffHalfDayBeforeMinutes: attendanceSetting?.staffHalfDayBeforeMinutes,
      staffMinimumWorkingMinutes: attendanceSetting?.staffMinimumWorkingMinutes,
      timeZone: staffProfile.branch.timezone
    });
    const attendanceDate = attendanceDateForBranch(now, calculationSettings.timeZone);
    const existingRecord = await tx.staffAttendanceRecord.findFirst({
      where: {
        tenantId: ctx.tenantId,
        branchId: staffProfile.branchId,
        staffId: staffProfile.id,
        attendanceDate
      }
    });

    const before = existingRecord;
    let after;
    let checkInStatus: "PRESENT" | "LATE" | null = null;
    let checkOutStatus: "PRESENT" | "HALF_DAY" | null = null;
    let workingMinutes: number | null = null;

    if (qrToken.purpose === "CHECK_IN") {
      if (existingRecord?.checkInAt) throw conflict("STAFF_ALREADY_CHECKED_IN");
      checkInStatus = calculateCheckInStatus({ checkInAt: now, settings: calculationSettings });
      const status = calculateFinalAttendanceStatus({ checkInStatus });

      if (existingRecord) {
        after = await tx.staffAttendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status,
            checkInAt: now,
            checkInSource: "QR_SCAN",
            checkInQrTokenId: qrToken.id,
            markedById: ctx.userId,
            updatedById: ctx.userId
          }
        });
      } else {
        after = await tx.staffAttendanceRecord.create({
          data: {
            tenantId: ctx.tenantId,
            branchId: staffProfile.branchId,
            academicYearId: ctx.activeAcademicYearId,
            staffId: staffProfile.id,
            attendanceDate,
            status,
            checkInAt: now,
            checkInSource: "QR_SCAN",
            checkInQrTokenId: qrToken.id,
            markedById: ctx.userId
          }
        });
      }
    } else {
      if (!existingRecord) throw conflict("STAFF_CHECK_IN_REQUIRED");
      if (!existingRecord.checkInAt) throw conflict("STAFF_CHECK_IN_REQUIRED");
      if (existingRecord.checkOutAt) throw conflict("STAFF_ALREADY_CHECKED_OUT");

      checkInStatus = calculateCheckInStatus({
        checkInAt: existingRecord.checkInAt,
        settings: calculationSettings
      });
      workingMinutes = calculateWorkingMinutes(existingRecord.checkInAt, now);
      checkOutStatus = calculateCheckOutStatus({ workingMinutes, settings: calculationSettings });
      const status = calculateFinalAttendanceStatus({ checkInStatus, checkOutStatus });
      after = await tx.staffAttendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status,
          checkOutAt: now,
          checkOutSource: "QR_SCAN",
          checkOutQrTokenId: qrToken.id,
          workingMinutes,
          updatedById: ctx.userId
        }
      });
    }

    await tx.staffAttendanceQrToken.update({
      where: { id: qrToken.id },
      data: { consumedCount: { increment: 1 } }
    });

    await writeAuditLog({
      ctx,
      action:
        qrToken.purpose === "CHECK_IN"
          ? STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_ATTENDANCE_CHECK_IN
          : STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_ATTENDANCE_CHECK_OUT,
      entityType: "StaffAttendanceRecord",
      entityId: after.id,
      branchId: staffProfile.branchId,
      academicYearId: after.academicYearId,
      before,
      after,
      metadata: {
        tenantId: ctx.tenantId,
        branchId: staffProfile.branchId,
        staffId: staffProfile.id,
        actorUserId: ctx.userId,
        attendanceRecordId: after.id,
        timestamp: now.toISOString(),
        purpose: qrToken.purpose,
        qrTokenId: qrToken.id,
        checkInStatus,
        checkOutStatus,
        workingMinutes,
        thresholds: {
          lateAfterTime: calculationSettings.staffLateAfterTime,
          halfDayBeforeMinutes: calculationSettings.staffHalfDayBeforeMinutes,
          fullDayMinutes: calculationSettings.staffMinimumWorkingMinutes,
          timeZone: calculationSettings.timeZone
        }
      }
    }, tx);

    return {
      success: true,
      purpose: qrToken.purpose,
      attendanceDate: toDateOnlyString(attendanceDate),
      checkInAt: after.checkInAt?.toISOString(),
      checkOutAt: after.checkOutAt?.toISOString(),
      ...(typeof after.workingMinutes === "number" ? { workingMinutes: after.workingMinutes } : {}),
      status: after.status,
      message: scanMessage(qrToken.purpose)
    };
  });
}
