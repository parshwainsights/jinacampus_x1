"use server";

import { revalidatePath } from "next/cache";
import { mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import { correctStaffAttendanceSchema } from "@/modules/staffboard-lite/schemas";
import {
  correctStaffAttendance,
  type CorrectStaffAttendanceResult
} from "@/modules/staffboard-lite/services/staff-attendance.service";

export type CorrectStaffAttendanceActionResult =
  | { ok: true; data: CorrectStaffAttendanceResult }
  | { ok: false; code: string; error: string; fieldErrors?: Record<string, string[]> };

function correctionActionError(error: unknown): CorrectStaffAttendanceActionResult {
  return mapActionError(error, {
    fallbackMessage: "Unable to correct staff attendance. Please try again.",
    validationMessage: "Please check the correction fields and enter a reason."
  });
}

function safeCorrectionResult(data: CorrectStaffAttendanceResult): CorrectStaffAttendanceResult {
  return {
    attendanceRecordId: data.attendanceRecordId,
    staffId: data.staffId,
    branchId: data.branchId,
    attendanceDate: data.attendanceDate,
    previousStatus: data.previousStatus,
    newStatus: data.newStatus,
    checkInAt: data.checkInAt,
    checkOutAt: data.checkOutAt,
    workingMinutes: data.workingMinutes,
    correctionReason: data.correctionReason,
    correctedById: data.correctedById
  };
}

export async function correctStaffAttendanceAction(input: unknown): Promise<CorrectStaffAttendanceActionResult> {
  try {
    const parsedInput = correctStaffAttendanceSchema.parse(input);
    const ctx = await getTenantContext();
    const data = await correctStaffAttendance(ctx, parsedInput);
    revalidatePath("/staffboard/attendance");
    revalidatePath("/staffboard/attendance/reports");
    return { ok: true, data: safeCorrectionResult(data) };
  } catch (error) {
    return correctionActionError(error);
  }
}
