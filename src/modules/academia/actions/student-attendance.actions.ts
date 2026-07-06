"use server";

import { revalidatePath } from "next/cache";
import { mapActionError } from "@/lib/errors";
import { getTenantContext } from "@/lib/tenant/context";
import {
  activeEnrolledStudentsForAttendanceSchema,
  submitStudentAttendanceSchema
} from "@/modules/academia/schemas";
import { getStudentAttendanceMarkingState } from "@/modules/academia/queries";
import { submitDailyStudentAttendance } from "@/modules/academia/services/student-attendance.service";

export type AttendanceActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; error: string; fieldErrors?: Record<string, string[]> };

function actionError(error: unknown): AttendanceActionResult<never> {
  return mapActionError(error, {
    fallbackMessage: "Unable to complete attendance action. Please try again.",
    validationMessage: "Please check the attendance fields and try again."
  });
}

export async function loadActiveStudentsForAttendanceAction(input: unknown) {
  try {
    const parsedInput = activeEnrolledStudentsForAttendanceSchema.parse(input);
    const ctx = await getTenantContext();
    const data = await getStudentAttendanceMarkingState(ctx, parsedInput);
    return { ok: true, data } as const;
  } catch (error) {
    return actionError(error);
  }
}

export async function submitDailyStudentAttendanceAction(input: unknown) {
  try {
    const parsedInput = submitStudentAttendanceSchema.parse(input);
    const ctx = await getTenantContext();
    const data = await submitDailyStudentAttendance(ctx, parsedInput);
    revalidatePath("/academia/attendance");
    revalidatePath("/academia/attendance/mark");
    return { ok: true, data } as const;
  } catch (error) {
    return actionError(error);
  }
}
