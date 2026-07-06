import type { Prisma, StaffAttendanceStatus } from "@prisma/client";
import { forbidden } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/context";
import { listStaffAttendanceSchema } from "@/modules/staffboard-lite/schemas";
import { pagination } from "./shared";

export type StaffAttendanceBranchOption = {
  id: string;
  name: string;
  code: string;
};

export type StaffAttendanceAdminRow = {
  attendanceRecordId: string | null;
  staffId: string;
  employeeCode: string;
  staffName: string;
  staffType: string;
  department: string | null;
  branchName: string;
  status: StaffAttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  workingMinutes: number | null;
  source: string;
  correctionReason: string | null;
};

export type StaffAttendanceDailySummary = {
  totalStaff: number;
  checkedIn: number;
  present: number;
  late: number;
  halfDay: number;
  absentNotMarked: number;
  onLeaveHoliday: number;
};

export type StaffAttendanceAdminData = {
  branchOptions: StaffAttendanceBranchOption[];
  selectedBranchId: string | null;
  selectedDate: string;
  summary: StaffAttendanceDailySummary;
  rows: StaffAttendanceAdminRow[];
  totalRows: number;
  page: number;
  pageSize: number;
};

const DEFAULT_ATTENDANCE_TIME_ZONE = "Asia/Kolkata";
const EMPTY_SUMMARY: StaffAttendanceDailySummary = {
  totalStaff: 0,
  checkedIn: 0,
  present: 0,
  late: 0,
  halfDay: 0,
  absentNotMarked: 0,
  onLeaveHoliday: 0
};

function isForbiddenPermissionError(error: unknown) {
  return error instanceof Error && error.message.startsWith("FORBIDDEN_");
}

function todayDateInTimeZone(timeZone = DEFAULT_ATTENDANCE_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(valueByType.get("year"));
  const month = Number(valueByType.get("month"));
  const day = Number(valueByType.get("day"));
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function staffName(staff: { firstName: string; middleName: string | null; lastName: string | null }) {
  return [staff.firstName, staff.middleName, staff.lastName].map((part) => part?.trim()).filter(Boolean).join(" ");
}

function sourceLabel(record: { checkInSource: string | null; checkOutSource: string | null } | null) {
  if (!record) return "-";
  const sources = [record.checkInSource, record.checkOutSource].filter(Boolean);
  return sources.length > 0 ? Array.from(new Set(sources)).join(" / ") : "-";
}

function summarize(rows: StaffAttendanceAdminRow[]): StaffAttendanceDailySummary {
  const summary = { ...EMPTY_SUMMARY, totalStaff: rows.length };
  for (const row of rows) {
    if (row.checkInAt) summary.checkedIn += 1;
    if (row.status === "PRESENT") summary.present += 1;
    if (row.status === "LATE") summary.late += 1;
    if (row.status === "HALF_DAY") summary.halfDay += 1;
    if (row.status === "ABSENT" || row.status === "NOT_MARKED") summary.absentNotMarked += 1;
    if (row.status === "ON_LEAVE" || row.status === "WEEK_OFF" || row.status === "HOLIDAY") {
      summary.onLeaveHoliday += 1;
    }
  }
  return summary;
}

export async function listStaffAttendanceBranchOptions(ctx: TenantContext): Promise<StaffAttendanceBranchOption[]> {
  if (ctx.accessibleBranchIds.length === 0) return [];

  const branches = await db.branch.findMany({
    where: {
      tenantId: ctx.tenantId,
      id: { in: ctx.accessibleBranchIds },
      status: { not: "ARCHIVED" }
    },
    select: {
      id: true,
      name: true,
      code: true
    },
    orderBy: [{ name: "asc" }, { code: "asc" }]
  });

  const allowedBranches: StaffAttendanceBranchOption[] = [];
  for (const branch of branches) {
    try {
      await requirePermission({ ctx, permission: "staffboard.attendance.view", branchId: branch.id });
      allowedBranches.push(branch);
    } catch (error) {
      if (isForbiddenPermissionError(error)) continue;
      throw error;
    }
  }

  return allowedBranches;
}

export async function listStaffAttendanceForDate(
  ctx: TenantContext,
  input: unknown = {}
): Promise<StaffAttendanceAdminData> {
  const params = listStaffAttendanceSchema.parse(input);
  const branchOptions = await listStaffAttendanceBranchOptions(ctx);
  if (branchOptions.length === 0) {
    return {
      branchOptions,
      selectedBranchId: null,
      selectedDate: toDateOnlyString(params.date ?? todayDateInTimeZone()),
      summary: EMPTY_SUMMARY,
      rows: [],
      totalRows: 0,
      page: params.page,
      pageSize: params.pageSize
    };
  }

  if (params.branchId && !branchOptions.some((branch) => branch.id === params.branchId)) {
    throw forbidden("FORBIDDEN_STAFF_ATTENDANCE_BRANCH");
  }

  const selectedBranchId =
    params.branchId ??
    (ctx.activeBranchId && branchOptions.some((branch) => branch.id === ctx.activeBranchId)
      ? ctx.activeBranchId
      : branchOptions[0].id);
  await requirePermission({ ctx, permission: "staffboard.attendance.view", branchId: selectedBranchId });

  const attendanceDate = params.date ?? todayDateInTimeZone();
  const where: Prisma.StaffProfileWhereInput = {
    tenantId: ctx.tenantId,
    branchId: selectedBranchId,
    employmentStatus: "ACTIVE",
    staffType: params.staffType,
    department: params.department ? { contains: params.department, mode: "insensitive" } : undefined
  };
  if (params.staffId) where.id = params.staffId;
  if (params.search) {
    where.OR = [
      { employeeCode: { contains: params.search, mode: "insensitive" } },
      { firstName: { contains: params.search, mode: "insensitive" } },
      { middleName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { department: { contains: params.search, mode: "insensitive" } },
      { designation: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } }
    ];
  }

  const staffProfiles = await db.staffProfile.findMany({
    where,
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      middleName: true,
      lastName: true,
      staffType: true,
      department: true,
      branch: { select: { name: true } },
      staffAttendanceRecords: {
        where: {
          tenantId: ctx.tenantId,
          branchId: selectedBranchId,
          attendanceDate
        },
        select: {
          id: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
          workingMinutes: true,
          checkInSource: true,
          checkOutSource: true,
          correctionReason: true
        },
        take: 1
      }
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { employeeCode: "asc" }]
  });

  const allRows = staffProfiles.map<StaffAttendanceAdminRow>((staff) => {
    const record = staff.staffAttendanceRecords[0] ?? null;
    return {
      attendanceRecordId: record?.id ?? null,
      staffId: staff.id,
      employeeCode: staff.employeeCode,
      staffName: staffName(staff),
      staffType: staff.staffType,
      department: staff.department,
      branchName: staff.branch.name,
      status: record?.status ?? "NOT_MARKED",
      checkInAt: record?.checkInAt?.toISOString() ?? null,
      checkOutAt: record?.checkOutAt?.toISOString() ?? null,
      workingMinutes: record?.workingMinutes ?? null,
      source: sourceLabel(record),
      correctionReason: record?.correctionReason ?? null
    };
  });
  const summary = summarize(allRows);
  const filteredRows = params.status ? allRows.filter((row) => row.status === params.status) : allRows;
  const { skip, take } = pagination(params);

  return {
    branchOptions,
    selectedBranchId,
    selectedDate: toDateOnlyString(attendanceDate),
    summary,
    rows: filteredRows.slice(skip, skip + take),
    totalRows: filteredRows.length,
    page: params.page,
    pageSize: params.pageSize
  };
}

export const getStaffAttendanceAdminPageData = listStaffAttendanceForDate;
