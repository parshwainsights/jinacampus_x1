import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    tenant: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    loginOtp: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    session: { create: vi.fn(), updateMany: vi.fn() },
    passwordCredential: { upsert: vi.fn() }
  };
  return {
    tx,
    db: {
      ...tx,
      $transaction: vi.fn()
    },
    generateNumericOtp: vi.fn(),
    hashOtp: vi.fn(),
    verifyOtp: vi.fn(),
    deliverOtp: vi.fn(),
    hashPassword: vi.fn(),
    createRawSessionToken: vi.fn(),
    hashSessionToken: vi.fn(),
    getSessionExpiresAt: vi.fn(),
    writeAuditLog: vi.fn()
  };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/auth/otp", () => ({
  generateNumericOtp: mocks.generateNumericOtp,
  hashOtp: mocks.hashOtp,
  verifyOtp: mocks.verifyOtp,
  deliverOtp: mocks.deliverOtp,
  normalizePhone: (phone: string) => phone.replace(/\D/g, "").length === 12 ? `+${phone.replace(/\D/g, "")}` : null,
  maskPhone: () => "+91******3210",
  getOtpExpiresAt: (now: Date) => new Date(now.getTime() + 300_000),
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("@/lib/auth/session", () => ({
  createRawSessionToken: mocks.createRawSessionToken,
  hashSessionToken: mocks.hashSessionToken,
  getSessionExpiresAt: mocks.getSessionExpiresAt
}));
vi.mock("@/lib/audit/audit-log", () => ({ writeAuditLog: mocks.writeAuditLog }));

import {
  OtpAuthError,
  requestAdminLoginOtp,
  resetPasswordWithOtp,
  verifyAdminLoginOtp
} from "@/modules/campus-core/otp-auth.service";

const tenant = { id: "tenant-a", name: "School A", status: "ACTIVE" };
const adminUser = {
  id: "admin-user",
  tenantId: tenant.id,
  email: "admin@example.com",
  phone: "+919876543210",
  firstName: "Admin",
  lastName: "User",
  displayName: "Admin User",
  userType: "STAFF",
  status: "ACTIVE",
  branchAccesses: [{ branchId: "branch-a", isPrimary: true }],
  roleAssignments: [{
    startsAt: null,
    endsAt: null,
    role: { code: "ADMIN", isActive: true, tenantId: tenant.id }
  }]
};

function otpRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "otp-id",
    tenantId: tenant.id,
    userId: adminUser.id,
    phone: adminUser.phone,
    otpHash: "hashed-otp",
    purpose: "ADMIN_LOGIN",
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    attempts: 0,
    createdAt: new Date(),
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx));
  mocks.db.tenant.findUnique.mockResolvedValue(tenant);
  mocks.db.user.findUnique.mockResolvedValue(adminUser);
  mocks.tx.tenant.findUnique.mockResolvedValue(tenant);
  mocks.tx.user.findUnique.mockResolvedValue(adminUser);
  mocks.tx.user.update.mockResolvedValue(adminUser);
  mocks.tx.loginOtp.findFirst.mockResolvedValue(null);
  mocks.tx.loginOtp.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.loginOtp.create.mockResolvedValue(otpRecord());
  mocks.tx.loginOtp.update.mockResolvedValue(otpRecord());
  mocks.tx.session.create.mockResolvedValue({});
  mocks.tx.session.updateMany.mockResolvedValue({ count: 2 });
  mocks.tx.passwordCredential.upsert.mockResolvedValue({});
  mocks.generateNumericOtp.mockReturnValue("123456");
  mocks.hashOtp.mockReturnValue("hashed-otp");
  mocks.verifyOtp.mockReturnValue(true);
  mocks.deliverOtp.mockResolvedValue({ mode: "DEVELOPMENT_LOG" });
  mocks.hashPassword.mockResolvedValue("hashed-new-password");
  mocks.createRawSessionToken.mockReturnValue("raw-session-token");
  mocks.hashSessionToken.mockResolvedValue("hashed-session-token");
  mocks.getSessionExpiresAt.mockReturnValue(new Date(Date.now() + 86_400_000));
  mocks.writeAuditLog.mockResolvedValue({});
});

describe("OTP auth service", () => {
  it("stores an OTP hash, never the raw OTP, and scopes the user lookup to the tenant", async () => {
    await requestAdminLoginOtp({ tenantSlug: "jinacampus-demo", phone: adminUser.phone, purpose: "ADMIN_LOGIN" });

    expect(mocks.db.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId_phone: { tenantId: tenant.id, phone: adminUser.phone } }
    }));
    expect(mocks.tx.loginOtp.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: tenant.id, userId: adminUser.id, otpHash: "hashed-otp" })
    }));
    expect(JSON.stringify(mocks.tx.loginOtp.create.mock.calls)).not.toContain("123456");
  });

  it("rejects expired OTPs without creating a session", async () => {
    mocks.tx.loginOtp.findFirst.mockResolvedValue(otpRecord({ expiresAt: new Date(Date.now() - 1_000) }));

    await expect(verifyAdminLoginOtp({
      tenantSlug: "jinacampus-demo",
      phone: adminUser.phone,
      otp: "123456",
      purpose: "ADMIN_LOGIN"
    })).rejects.toBeInstanceOf(OtpAuthError);
    expect(mocks.tx.session.create).not.toHaveBeenCalled();
  });

  it("increments attempts for a wrong OTP", async () => {
    mocks.tx.loginOtp.findFirst.mockResolvedValue(otpRecord({ attempts: 2 }));
    mocks.verifyOtp.mockReturnValue(false);

    await expect(verifyAdminLoginOtp({
      tenantSlug: "jinacampus-demo",
      phone: adminUser.phone,
      otp: "654321",
      purpose: "ADMIN_LOGIN"
    })).rejects.toBeInstanceOf(OtpAuthError);
    expect(mocks.tx.loginOtp.update).toHaveBeenCalledWith({ where: { id: "otp-id" }, data: { attempts: 3 } });
  });

  it("rejects an OTP after the maximum attempts", async () => {
    mocks.tx.loginOtp.findFirst.mockResolvedValue(otpRecord({ attempts: 5 }));

    await expect(verifyAdminLoginOtp({
      tenantSlug: "jinacampus-demo",
      phone: adminUser.phone,
      otp: "123456",
      purpose: "ADMIN_LOGIN"
    })).rejects.toBeInstanceOf(OtpAuthError);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.tx.session.create).not.toHaveBeenCalled();
  });

  it("consumes a valid OTP and creates a tenant-scoped session", async () => {
    mocks.tx.loginOtp.findFirst.mockResolvedValue(otpRecord());

    const result = await verifyAdminLoginOtp({
      tenantSlug: "jinacampus-demo",
      phone: adminUser.phone,
      otp: "123456",
      purpose: "ADMIN_LOGIN"
    });

    expect(result.rawToken).toBe("raw-session-token");
    expect(result.redirectTo).toBe("/dashboard");
    expect(mocks.tx.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: tenant.id, userId: adminUser.id, tokenHash: "hashed-session-token" })
    });
    expect(mocks.tx.loginOtp.updateMany).toHaveBeenCalledWith({
      where: { id: "otp-id", consumedAt: null },
      data: { consumedAt: expect.any(Date) }
    });
  });

  it("resets a password, clears mustChange, and revokes old sessions", async () => {
    mocks.tx.loginOtp.findFirst.mockResolvedValue(otpRecord({ purpose: "FORGOT_PASSWORD" }));

    await resetPasswordWithOtp({
      tenantSlug: "jinacampus-demo",
      email: adminUser.email,
      otp: "123456",
      newPassword: "StrongPass@123"
    });

    expect(mocks.tx.passwordCredential.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ passwordHash: "hashed-new-password", mustChange: false })
    }));
    expect(mocks.tx.session.updateMany).toHaveBeenCalledWith({
      where: { tenantId: tenant.id, userId: adminUser.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
    expect(JSON.stringify(mocks.writeAuditLog.mock.calls)).not.toMatch(/StrongPass@123|123456|hashed-otp/);
  });
});
