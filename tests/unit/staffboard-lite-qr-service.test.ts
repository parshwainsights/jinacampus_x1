import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAFFBOARD_LITE_AUDIT_EVENTS } from "@/modules/staffboard-lite/audit-events";
import {
  generateStaffAttendanceQrToken,
  hashStaffAttendanceQrToken
} from "@/modules/staffboard-lite/services/staff-qr.service";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    auditLog: { create: vi.fn() },
    branch: { findFirst: vi.fn() },
    attendanceSetting: { findFirst: vi.fn() },
    staffAttendanceQrToken: { create: vi.fn() }
  };
  const db = {
    ...tx,
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx))
  };
  const requirePermission = vi.fn();
  const writeAuditLog = vi.fn();
  return { db, requirePermission, tx, writeAuditLog };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rbac/require-permission", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));

const branchId = "00000000-0000-0000-0000-000000000003";
const selectedBranchId = "00000000-0000-0000-0000-000000000006";
const qrTokenId = "00000000-0000-0000-0000-000000000005";

const ctx: TenantContext = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  userEmail: "admin@example.com",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000004"
};

function resetMocks() {
  for (const model of Object.values(mocks.tx)) {
    for (const method of Object.values(model)) {
      method.mockReset();
    }
  }
  mocks.db.$transaction.mockReset();
  mocks.db.$transaction.mockImplementation((callback: (client: typeof mocks.tx) => unknown) => callback(mocks.tx));
  mocks.requirePermission.mockReset();
  mocks.requirePermission.mockResolvedValue(true);
  mocks.writeAuditLog.mockReset();
  mocks.writeAuditLog.mockResolvedValue({ id: "audit-id" });
  mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId });
  mocks.tx.attendanceSetting.findFirst.mockResolvedValue(null);
  mocks.tx.staffAttendanceQrToken.create.mockImplementation(({ data }) => ({
    id: qrTokenId,
    purpose: data.purpose,
    branchId: data.branchId,
    validFrom: data.validFrom,
    validUntil: data.validUntil
  }));
}

function parseQrPayload(result: Awaited<ReturnType<typeof generateStaffAttendanceQrToken>>) {
  return JSON.parse(result.qrPayload) as { type: string; token: string };
}

describe("StaffBoard Lite QR generation service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T04:30:00.000Z"));
    resetMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hashes QR tokens with deterministic SHA-256 without returning the raw token as the hash", () => {
    const rawToken = "phase-7-qr-security-token";
    const hash = hashStaffAttendanceQrToken(rawToken);

    expect(hash).toBe(createHash("sha256").update(rawToken).digest("hex"));
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(rawToken);
  });

  it("generates a secure CHECK_IN QR token", async () => {
    const result = await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN", validForSeconds: 120 });
    const payload = parseQrPayload(result);

    expect(result).toEqual(expect.objectContaining({
      qrTokenId,
      purpose: "CHECK_IN",
      branchId,
      expiresInSeconds: 120,
      validFrom: "2026-05-05T04:30:00.000Z",
      validUntil: "2026-05-05T04:32:00.000Z"
    }));
    expect(payload.type).toBe("STAFF_ATTENDANCE_QR");
    expect(payload.token).toHaveLength(43);
  });

  it("generates a CHECK_OUT QR token", async () => {
    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_OUT" })).resolves.toMatchObject({
      purpose: "CHECK_OUT",
      expiresInSeconds: 180
    });

    expect(mocks.tx.staffAttendanceQrToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ purpose: "CHECK_OUT" })
    }));
  });

  it("requires staffboard.attendance.qr.generate permission", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("FORBIDDEN_PERMISSION:staffboard.attendance.qr.generate"));

    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" })).rejects.toThrow(
      "FORBIDDEN_PERMISSION:staffboard.attendance.qr.generate"
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "staffboard.attendance.qr.generate",
      branchId
    });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("uses tenantId and actor user from server context", async () => {
    await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" });

    expect(mocks.tx.staffAttendanceQrToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenantId: ctx.tenantId,
        branchId,
        createdById: ctx.userId
      })
    }));
  });

  it("verifies branch access and active branch scope", async () => {
    await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" });

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx,
      permission: "staffboard.attendance.qr.generate",
      branchId
    });
    expect(mocks.tx.branch.findFirst).toHaveBeenCalledWith({
      where: { id: branchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
      select: { id: true }
    });
  });

  it("uses a verified branchId from QR generation input when provided", async () => {
    mocks.tx.branch.findFirst.mockResolvedValue({ id: selectedBranchId });

    await generateStaffAttendanceQrToken(
      { ...ctx, activeBranchId: null, accessibleBranchIds: [branchId, selectedBranchId] },
      { branchId: selectedBranchId, purpose: "CHECK_IN" }
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      ctx: { ...ctx, activeBranchId: null, accessibleBranchIds: [branchId, selectedBranchId] },
      permission: "staffboard.attendance.qr.generate",
      branchId: selectedBranchId
    });
    expect(mocks.tx.branch.findFirst).toHaveBeenCalledWith({
      where: { id: selectedBranchId, tenantId: ctx.tenantId, status: { not: "ARCHIVED" } },
      select: { id: true }
    });
    expect(mocks.tx.staffAttendanceQrToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ branchId: selectedBranchId })
    }));
  });

  it("rejects generation when StaffBoard QR attendance is disabled", async () => {
    mocks.tx.attendanceSetting.findFirst.mockResolvedValue({
      staffQrAttendanceEnabled: false,
      staffQrTokenValiditySeconds: 180
    });

    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" })).rejects.toMatchObject({
      code: "STAFF_QR_ATTENDANCE_DISABLED",
      status: 403
    });

    expect(mocks.tx.staffAttendanceQrToken.create).not.toHaveBeenCalled();
  });

  it("uses AttendanceSetting.staffQrTokenValiditySeconds when input validity is absent", async () => {
    mocks.tx.attendanceSetting.findFirst.mockResolvedValue({
      staffQrAttendanceEnabled: true,
      staffQrTokenValiditySeconds: 240
    });

    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" })).resolves.toMatchObject({
      expiresInSeconds: 240,
      validUntil: "2026-05-05T04:34:00.000Z"
    });
  });

  it("uses default 180 second validity when no AttendanceSetting exists", async () => {
    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" })).resolves.toMatchObject({
      expiresInSeconds: 180,
      validUntil: "2026-05-05T04:33:00.000Z"
    });
  });

  it("rejects too-short validity", async () => {
    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN", validForSeconds: 10 })).rejects.toMatchObject({
      code: "INVALID_STAFF_QR_TOKEN_VALIDITY_SECONDS"
    });

    expect(mocks.tx.staffAttendanceQrToken.create).not.toHaveBeenCalled();
  });

  it("rejects too-long validity", async () => {
    await expect(generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN", validForSeconds: 901 })).rejects.toThrow();

    expect(mocks.requirePermission).not.toHaveBeenCalled();
    expect(mocks.tx.staffAttendanceQrToken.create).not.toHaveBeenCalled();
  });

  it("stores tokenHash but never stores the raw token", async () => {
    const result = await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" });
    const payload = parseQrPayload(result);
    const createArg = mocks.tx.staffAttendanceQrToken.create.mock.calls[0][0];

    expect(createArg.data.tokenHash).toBe(hashStaffAttendanceQrToken(payload.token));
    expect(createArg.data.tokenHash).toBe(createHash("sha256").update(payload.token).digest("hex"));
    expect(JSON.stringify(createArg.data)).not.toContain(payload.token);
    expect(createArg.data).not.toHaveProperty("rawToken");
  });

  it("returns raw token only inside qrPayload and never returns tokenHash", async () => {
    const result = await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" });
    const payload = parseQrPayload(result);
    const serialized = JSON.stringify(result);

    expect(serialized).toContain(payload.token);
    expect(serialized.match(new RegExp(payload.token, "g"))).toHaveLength(1);
    expect(result).not.toHaveProperty("tokenHash");
  });

  it("does not write raw token or tokenHash to audit metadata", async () => {
    const result = await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN" });
    const payload = parseQrPayload(result);
    const createArg = mocks.tx.staffAttendanceQrToken.create.mock.calls[0][0];
    const auditArg = mocks.writeAuditLog.mock.calls[0][0];
    const serializedAudit = JSON.stringify(auditArg);

    expect(auditArg).toEqual(expect.objectContaining({
      ctx,
      action: STAFFBOARD_LITE_AUDIT_EVENTS.STAFF_ATTENDANCE_QR_GENERATED,
      entityType: "StaffAttendanceQrToken",
      entityId: qrTokenId,
      branchId,
      metadata: expect.objectContaining({
        tenantId: ctx.tenantId,
        branchId,
        actorUserId: ctx.userId,
        qrTokenId,
        purpose: "CHECK_IN"
      })
    }));
    expect(serializedAudit).not.toContain(payload.token);
    expect(serializedAudit).not.toContain(createArg.data.tokenHash);
    expect(serializedAudit).not.toContain("qrPayload");
  });

  it("creates validFrom and validUntil correctly", async () => {
    await generateStaffAttendanceQrToken(ctx, { purpose: "CHECK_IN", validForSeconds: 300 });

    expect(mocks.tx.staffAttendanceQrToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        validFrom: new Date("2026-05-05T04:30:00.000Z"),
        validUntil: new Date("2026-05-05T04:35:00.000Z"),
        consumedCount: 0
      })
    }));
  });
});
