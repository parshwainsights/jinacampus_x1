import { db } from "@/lib/db";
import { normalizeSchoolId } from "@/modules/campus-core/tenant-login-policy";

export type TenantLoginBranding = {
  schoolId: string | null;
  schoolName: string | null;
  logoUrl: string | null;
};

export async function getSchoolLoginBranding(schoolId: string | null): Promise<TenantLoginBranding> {
  const normalizedSchoolId = normalizeSchoolId(schoolId);
  if (!normalizedSchoolId) return { schoolId: null, schoolName: null, logoUrl: null };

  const tenant = await db.tenant.findUnique({
    where: { slug: normalizedSchoolId },
    select: {
      name: true,
      status: true,
      institutions: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        take: 1,
        select: { name: true, displayName: true, logoUrl: true }
      }
    }
  });

  if (!tenant || tenant.status !== "ACTIVE") {
    return { schoolId: normalizedSchoolId, schoolName: null, logoUrl: null };
  }

  const institution = tenant.institutions[0] ?? null;

  return {
    schoolId: normalizedSchoolId,
    schoolName: institution?.displayName ?? institution?.name ?? tenant.name,
    logoUrl: institution?.logoUrl ?? null
  };
}

export const getTenantLoginBranding = getSchoolLoginBranding;
