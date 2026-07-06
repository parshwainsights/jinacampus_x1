import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignUserBranchService,
  assignUserRoleService,
  removeUserBranchService,
  removeUserRoleService
} from "@/modules/campus-core/services";
import type { TenantContext } from "@/lib/tenant/context";

const mocks = vi.hoisted(() => {
  const tx = {
    academicYear: { findFirst: vi.fn() },
    branch: { findFirst: vi.fn() },
    role: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    userBranchAccess: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    userRoleAssignment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() }
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

const tenantId = "00000000-0000-0000-0000-000000000001";
const actorUserId = "00000000-0000-0000-0000-000000000002";
const branchId = "00000000-0000-0000-0000-000000000003";
const userId = "00000000-0000-0000-0000-000000000004";
const roleId = "00000000-0000-0000-0000-000000000005";

const ctx: TenantContext = {
  tenantId,
  userId: actorUserId,
  userEmail: "admin@example.test",
  userType: "STAFF",
  activeBranchId: branchId,
  accessibleBranchIds: [branchId],
  activeAcademicYearId: "00000000-0000-0000-0000-000000000006"
};

const roleInput = {
  userId,
  roleId,
  scopeType: "TENANT" as const,
  scopeId: "TENANT"
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
}

describe("CampusCore user access management", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("requires user governance permission before assigning roles", async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error("FORBIDDEN_PERMISSION:campuscore.user.manage"));

    await expect(assignUserRoleService(ctx, roleInput)).rejects.toThrow("FORBIDDEN_PERMISSION:campuscore.user.manage");

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "campuscore.user.manage" });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("assigns roles with tenant-scoped user and role lookups", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId, email: "teacher@example.test" });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "TEACHER", name: "Teacher" });
    mocks.tx.userRoleAssignment.findUnique.mockResolvedValue(null);
    mocks.tx.userRoleAssignment.create.mockResolvedValue({ id: "assignment-id", userId, roleId, isActive: true });

    await assignUserRoleService(ctx, roleInput);

    expect(mocks.tx.user.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: userId, tenantId, status: { not: "DEACTIVATED" } }),
      select: { id: true, email: true }
    });
    expect(mocks.tx.role.findFirst).toHaveBeenCalledWith({
      where: { id: roleId, tenantId, isActive: true },
      select: { id: true, code: true, name: true }
    });
    expect(mocks.tx.userRoleAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId, userId, roleId, scopeType: "TENANT", scopeId: "TENANT", assignedById: actorUserId })
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "campuscore.user.role_assigned",
      entityType: "User",
      entityId: userId,
      metadata: expect.objectContaining({ roleCode: "TEACHER" })
    }), mocks.tx);
  });

  it("handles duplicate active role assignments safely", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "TEACHER", name: "Teacher" });
    mocks.tx.userRoleAssignment.findUnique.mockResolvedValue({ id: "assignment-id", isActive: true });

    await expect(assignUserRoleService(ctx, roleInput)).rejects.toThrow("USER_ROLE_ALREADY_ASSIGNED");

    expect(mocks.tx.userRoleAssignment.create).not.toHaveBeenCalled();
    expect(mocks.tx.userRoleAssignment.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("reactivates inactive role assignments and clears stale date limits", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId, email: "teacher@example.test" });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "TEACHER", name: "Teacher" });
    mocks.tx.userRoleAssignment.findUnique.mockResolvedValue({
      id: "assignment-id",
      isActive: false,
      startsAt: null,
      endsAt: new Date("2026-01-01T00:00:00.000Z")
    });
    mocks.tx.userRoleAssignment.update.mockResolvedValue({ id: "assignment-id", isActive: true, startsAt: null, endsAt: null });

    await assignUserRoleService(ctx, roleInput);

    expect(mocks.tx.userRoleAssignment.update).toHaveBeenCalledWith({
      where: { id: "assignment-id" },
      data: {
        assignedById: actorUserId,
        startsAt: null,
        endsAt: null,
        isActive: true
      }
    });
  });

  it("soft-removes role assignments with tenant-scoped user and role lookups", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "TEACHER" });
    mocks.tx.userRoleAssignment.findUnique.mockResolvedValue({ id: "assignment-id", userId, roleId, isActive: true });
    mocks.tx.userRoleAssignment.update.mockResolvedValue({ id: "assignment-id", isActive: false });

    await removeUserRoleService(ctx, roleInput);

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "campuscore.user.manage" });
    expect(mocks.tx.userRoleAssignment.update).toHaveBeenCalledWith({
      where: { id: "assignment-id" },
      data: expect.objectContaining({ isActive: false })
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "campuscore.user.role_removed"
    }), mocks.tx);
  });

  it("requires user update permission and branch access before assigning branches", async () => {
    await expect(assignUserBranchService({ ...ctx, accessibleBranchIds: [] }, { userId, branchId })).rejects.toThrow("FORBIDDEN_BRANCH_ACCESS");

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx: { ...ctx, accessibleBranchIds: [] }, permission: "campuscore.user.update", branchId });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("assigns branch access with tenant-scoped user and branch lookups", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId, email: "staff@example.test" });
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId, code: "MAIN", name: "Main Branch" });
    mocks.tx.userBranchAccess.findUnique.mockResolvedValue(null);
    mocks.tx.userBranchAccess.create.mockResolvedValue({ id: "branch-access-id", userId, branchId, isActive: true });

    await assignUserBranchService(ctx, { userId, branchId });

    expect(mocks.tx.user.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: userId, tenantId, status: { not: "DEACTIVATED" } }),
      select: { id: true, email: true }
    });
    expect(mocks.tx.branch.findFirst).toHaveBeenCalledWith({
      where: { id: branchId, tenantId, status: { not: "ARCHIVED" } },
      select: { id: true, code: true, name: true }
    });
    expect(mocks.tx.userBranchAccess.create).toHaveBeenCalledWith({
      data: { tenantId, userId, branchId, grantedById: actorUserId }
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "campuscore.user.branch_assigned",
      branchId,
      metadata: expect.objectContaining({ branchCode: "MAIN" })
    }), mocks.tx);
  });

  it("handles duplicate active branch access safely", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId, code: "MAIN", name: "Main Branch" });
    mocks.tx.userBranchAccess.findUnique.mockResolvedValue({ id: "branch-access-id", isActive: true });

    await expect(assignUserBranchService(ctx, { userId, branchId })).rejects.toThrow("USER_BRANCH_ALREADY_ASSIGNED");

    expect(mocks.tx.userBranchAccess.create).not.toHaveBeenCalled();
    expect(mocks.tx.userBranchAccess.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("soft-removes branch access without deleting user or branch records", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId, code: "MAIN" });
    mocks.tx.userBranchAccess.findUnique.mockResolvedValue({ id: "branch-access-id", userId, branchId, isActive: true });
    mocks.tx.userBranchAccess.count.mockResolvedValue(2);
    mocks.tx.userBranchAccess.update.mockResolvedValue({ id: "branch-access-id", isActive: false });

    await removeUserBranchService(ctx, { userId, branchId });

    expect(mocks.requirePermission).toHaveBeenCalledWith({ ctx, permission: "campuscore.user.update", branchId });
    expect(mocks.tx.userBranchAccess.count).toHaveBeenCalledWith({
      where: { tenantId, userId, isActive: true }
    });
    expect(mocks.tx.userBranchAccess.update).toHaveBeenCalledWith({
      where: { id: "branch-access-id" },
      data: { isActive: false, isPrimary: false }
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "campuscore.user.branch_removed"
    }), mocks.tx);
  });

  it("prevents removing a user's final active branch access", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.branch.findFirst.mockResolvedValue({ id: branchId, code: "MAIN" });
    mocks.tx.userBranchAccess.findUnique.mockResolvedValue({ id: "branch-access-id", userId, branchId, isActive: true });
    mocks.tx.userBranchAccess.count.mockResolvedValue(1);

    await expect(removeUserBranchService(ctx, { userId, branchId })).rejects.toThrow("USER_BRANCH_ACCESS_REQUIRED");

    expect(mocks.tx.userBranchAccess.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant roles and branches through tenant-scoped lookups", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.role.findFirst.mockResolvedValue(null);

    await expect(assignUserRoleService(ctx, roleInput)).rejects.toThrow("ROLE_NOT_FOUND");

    resetMocks();
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId });
    mocks.tx.branch.findFirst.mockResolvedValue(null);

    await expect(assignUserBranchService(ctx, { userId, branchId })).rejects.toThrow("BRANCH_NOT_FOUND");
  });

  it("prevents principals from assigning platform-admin roles", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId, email: "teacher@example.test" });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "ADMIN", name: "Admin" });

    await expect(assignUserRoleService({ ...ctx, roleCodes: ["PRINCIPAL"] }, roleInput)).rejects.toThrow("ROLE_ASSIGNMENT_NOT_ALLOWED");

    expect(mocks.tx.userRoleAssignment.create).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("allows platform admins to assign platform-admin roles", async () => {
    mocks.tx.user.findFirst.mockResolvedValue({ id: userId, email: "admin@example.test" });
    mocks.tx.role.findFirst.mockResolvedValue({ id: roleId, code: "ADMIN", name: "Admin" });
    mocks.tx.userRoleAssignment.findUnique.mockResolvedValue(null);
    mocks.tx.userRoleAssignment.create.mockResolvedValue({ id: "assignment-id", userId, roleId, isActive: true });

    await assignUserRoleService({ ...ctx, roleCodes: ["TENANT_OWNER"] }, roleInput);

    expect(mocks.tx.userRoleAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId, userId, roleId, assignedById: actorUserId })
    });
  });
});
