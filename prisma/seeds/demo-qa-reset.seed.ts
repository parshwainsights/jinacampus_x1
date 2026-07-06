import type { PrismaClient } from "@prisma/client";
import { DEMO_BRANCH, DEMO_STAFF_PROFILES, DEMO_TENANT } from "./demo-data.seed";

const INDIA_TIME_ZONE = "Asia/Kolkata";

export const DEMO_QA_RESET_EMPLOYEE_CODES = ["JD-TCH-001", "JD-STF-001"] as const;

export type DemoQaResetSummary = {
  tenantSlug: string;
  branchCode: string;
  attendanceDate: string;
  staffEmployeeCodes: string[];
  matchedStaffProfiles: number;
  deletedStaffAttendanceRecords: number;
};

export function assertDemoQaResetAllowed(nodeEnv: string | undefined = process.env.NODE_ENV) {
  if (nodeEnv === "production") {
    throw new Error("Demo QA reset is disabled when NODE_ENV is production.");
  }
}

export function demoQaResetAttendanceDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return new Date(Date.UTC(
    Number(values.get("year") ?? "2026"),
    Number(values.get("month") ?? "1") - 1,
    Number(values.get("day") ?? "1")
  ));
}

export async function resetDemoQaState(
  db: PrismaClient,
  options: { attendanceDate?: Date; nodeEnv?: string } = {}
): Promise<DemoQaResetSummary> {
  assertDemoQaResetAllowed(options.nodeEnv);

  const tenant = await db.tenant.findUnique({
    where: { slug: DEMO_TENANT.slug },
    select: { id: true, slug: true }
  });
  if (!tenant) {
    throw new Error(`Demo tenant not found: ${DEMO_TENANT.slug}`);
  }

  const branch = await db.branch.findFirst({
    where: { tenantId: tenant.id, code: DEMO_BRANCH.code, status: { not: "ARCHIVED" } },
    select: { id: true, code: true }
  });
  if (!branch) {
    throw new Error(`Demo branch not found for tenant: ${DEMO_TENANT.slug}`);
  }

  const attendanceDate = options.attendanceDate ?? demoQaResetAttendanceDate();
  const staffEmployeeCodes = Array.from(DEMO_QA_RESET_EMPLOYEE_CODES);
  const staffProfiles = await db.staffProfile.findMany({
    where: {
      tenantId: tenant.id,
      branchId: branch.id,
      employeeCode: { in: staffEmployeeCodes },
      employmentStatus: "ACTIVE"
    },
    select: { id: true, employeeCode: true }
  });
  const staffIds = staffProfiles.map((staff) => staff.id);

  let deletedStaffAttendanceRecords = 0;
  if (staffIds.length > 0) {
    const result = await db.staffAttendanceRecord.deleteMany({
      where: {
        tenantId: tenant.id,
        branchId: branch.id,
        staffId: { in: staffIds },
        attendanceDate
      }
    });
    deletedStaffAttendanceRecords = result.count;
  }

  return {
    tenantSlug: tenant.slug,
    branchCode: branch.code,
    attendanceDate: attendanceDate.toISOString().slice(0, 10),
    staffEmployeeCodes,
    matchedStaffProfiles: staffProfiles.length,
    deletedStaffAttendanceRecords
  };
}

export function demoQaResetStaffProfilesAreSeeded() {
  const seededCodes = new Set(DEMO_STAFF_PROFILES.map((profile) => profile.employeeCode));
  return DEMO_QA_RESET_EMPLOYEE_CODES.every((employeeCode) => seededCodes.has(employeeCode));
}
