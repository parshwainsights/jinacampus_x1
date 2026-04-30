import { unauthorized } from "@/core/errors/http";

export type SessionLike = {
  user?: {
    id?: string;
    tenantId?: string;
    branchIds?: string[];
    activeBranchId?: string | null;
    activeAcademicYearId?: string | null;
  };
};

export type TenantContext = {
  userId: string;
  tenantId: string;
  branchIds: string[];
  activeBranchId: string | null;
  activeAcademicYearId: string | null;
};

export function resolveTenantContext(session: SessionLike): TenantContext {
  if (!session?.user?.id || !session.user.tenantId) throw unauthorized();
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    branchIds: session.user.branchIds ?? [],
    activeBranchId: session.user.activeBranchId ?? null,
    activeAcademicYearId: session.user.activeAcademicYearId ?? null,
  };
}
