import { notFound } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/require-permission";
import type { TenantContext } from "@/lib/tenant/context";
import {
  listActiveEnrolledStudentsForAttendance,
  listClassSectionsForAttendance
} from "@/modules/academia/queries";
import { submitDailyStudentAttendance } from "@/modules/academia/services/student-attendance.service";
import {
  mobileClassSectionParamsSchema,
  mobileStudentAttendanceSubmitSchema
} from "./schemas";

export async function listMobileTeacherClassSections(ctx: TenantContext) {
  if (!ctx.activeBranchId || !ctx.activeAcademicYearId) return { classSections: [] };

  await requirePermission({
    ctx,
    permission: "academia.attendance.mark",
    branchId: ctx.activeBranchId,
    academicYearId: ctx.activeAcademicYearId
  });

  const classSections = await listClassSectionsForAttendance(ctx);
  return {
    classSections: classSections.map((classSection) => ({
      id: classSection.id,
      className: classSection.className,
      sectionName: classSection.sectionName,
      displayName: classSection.displayName
    }))
  };
}

async function ensureMobileClassSectionAccess(ctx: TenantContext, classSectionId: string) {
  const { classSections } = await listMobileTeacherClassSections(ctx);
  const classSection = classSections.find((section) => section.id === classSectionId);
  if (!classSection) throw notFound("CLASS_SECTION_NOT_FOUND");
  return classSection;
}

export async function listMobileTeacherClassSectionStudents(ctx: TenantContext, input: unknown) {
  const params = mobileClassSectionParamsSchema.parse(input);
  await ensureMobileClassSectionAccess(ctx, params.classSectionId);
  const students = await listActiveEnrolledStudentsForAttendance(ctx, { classSectionId: params.classSectionId });
  return {
    students: students.map((student) => ({
      studentId: student.studentId,
      admissionNo: student.admissionNo,
      rollNumber: student.rollNumber,
      name: student.displayName
    }))
  };
}

export async function submitMobileStudentAttendance(ctx: TenantContext, input: unknown) {
  const data = mobileStudentAttendanceSubmitSchema.parse(input);
  const result = await submitDailyStudentAttendance(ctx, data);
  return {
    message: "Attendance submitted successfully.",
    summary: {
      total: result.submittedCount,
      activeStudents: result.totalActiveStudents,
      present: result.presentCount,
      absent: result.absentCount,
      late: result.lateCount,
      halfDay: result.halfDayCount,
      onLeave: result.onLeaveCount,
      excused: result.excusedCount,
      created: result.createdCount,
      updated: result.updatedCount
    }
  };
}
