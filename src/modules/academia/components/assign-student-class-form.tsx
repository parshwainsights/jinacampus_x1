"use client";

import { useActionState } from "react";
import { FormField, FormMessage, getFieldError } from "@/components/ui/form-primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  assignStudentClassAction,
  type ProfileFormActionState
} from "@/modules/academia/actions/profile.actions";
import type { StudentRegistrationClassSectionOption } from "@/modules/academia/queries";

const initialState: ProfileFormActionState = { ok: false };

export function AssignStudentClassForm({
  studentId,
  classSections,
  defaultEnrollmentDate
}: {
  studentId: string;
  classSections: StudentRegistrationClassSectionOption[];
  defaultEnrollmentDate: string;
}) {
  const [state, action] = useActionState(assignStudentClassAction, initialState);

  return (
    <section className="premium-card p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Assign Class</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Create the active academic-year enrollment required for class lists and daily attendance.
        </p>
      </div>
      <FormMessage state={state} />
      <form action={action} className="mt-4 grid gap-4 md:grid-cols-3 md:items-end">
        <input type="hidden" name="studentId" value={studentId} />
        <FormField
          id="assign-student-class-section"
          label="Class Section"
          required
          error={getFieldError(state.fieldErrors, "classSectionId")}
        >
          <select
            id="assign-student-class-section"
            name="classSectionId"
            required
            disabled={!classSections.length}
            defaultValue=""
            className="min-h-11 w-full"
          >
            <option value="">{classSections.length ? "Select class section" : "No active class sections"}</option>
            {classSections.map((classSection) => (
              <option key={classSection.id} value={classSection.id}>
                {classSection.displayName} - {classSection.academicYearName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="assign-student-roll-number"
          label="Roll Number"
          helpText="Optional within this class-section."
          error={getFieldError(state.fieldErrors, "rollNumber")}
        >
          <input id="assign-student-roll-number" name="rollNumber" className="min-h-11 w-full" />
        </FormField>
        <FormField
          id="assign-student-enrolled-on"
          label="Enrollment Date"
          required
          error={getFieldError(state.fieldErrors, "enrolledOn")}
        >
          <input
            id="assign-student-enrolled-on"
            name="enrolledOn"
            type="date"
            defaultValue={defaultEnrollmentDate}
            required
            className="min-h-11 w-full"
          />
        </FormField>
        <div className="md:col-span-3 md:flex md:justify-end">
          <SubmitButton disabled={!classSections.length} pendingLabel="Assigning class...">
            Assign Class
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
