"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { FormField, FormMessage, getFieldError } from "@/components/ui/form-primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createClassAction,
  createClassSectionAction,
  createSectionAction,
  createSubjectAction,
  type ProfileFormActionState
} from "@/modules/academia/actions/profile.actions";
import type { ClassTeacherOption } from "@/modules/academia/queries";

type SetupRecordOption = {
  id: string;
  code: string;
  name: string;
};

type AcademicSetupFormsProps = {
  classes: SetupRecordOption[];
  sections: SetupRecordOption[];
  teachers: ClassTeacherOption[];
  activeBranchName?: string | null;
  activeAcademicYearName?: string | null;
};

const initialState: ProfileFormActionState = { ok: false };

function errorFor(state: ProfileFormActionState, field: string) {
  return getFieldError(state.fieldErrors, field);
}

function SetupFormShell({
  id,
  step,
  title,
  description,
  listHref,
  state,
  children
}: {
  id: string;
  step: string;
  title: string;
  description: string;
  listHref: string;
  state: ProfileFormActionState;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200 py-6 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{step}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <Link href={listHref} className="premium-secondary-button w-full sm:w-auto">
          View records
        </Link>
      </div>
      <FormMessage state={state} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CreateClassSetupForm() {
  const [state, action] = useActionState(createClassAction, initialState);

  return (
    <SetupFormShell
      id="classes"
      step="Step 1"
      title="Classes"
      description="Create reusable class levels such as Nursery, Class 1, or Class 10."
      listHref="/academia/classes"
      state={state}
    >
      <form action={action} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FormField id="setup-class-code" label="Code" required helpText="Short code used in lists and reports." error={errorFor(state, "code")}>
          <input id="setup-class-code" name="code" placeholder="CLASS_1" required className="min-h-11 w-full uppercase" />
        </FormField>
        <FormField id="setup-class-name" label="Name" required error={errorFor(state, "name")}>
          <input id="setup-class-name" name="name" placeholder="Class 1" required className="min-h-11 w-full" />
        </FormField>
        <FormField id="setup-class-sort" label="Sort Order" helpText="Lower numbers appear first." error={errorFor(state, "sortOrder")}>
          <input id="setup-class-sort" name="sortOrder" type="number" min={0} max={10000} placeholder="1" className="min-h-11 w-full" />
        </FormField>
        <FormField id="setup-class-description" label="Description" error={errorFor(state, "description")}>
          <input id="setup-class-description" name="description" placeholder="Optional" className="min-h-11 w-full" />
        </FormField>
        <input type="hidden" name="status" value="ACTIVE" />
        <div className="md:col-span-2 lg:col-span-4 lg:flex lg:justify-end">
          <SubmitButton pendingLabel="Adding class...">Add Class</SubmitButton>
        </div>
      </form>
    </SetupFormShell>
  );
}

export function CreateSectionSetupForm() {
  const [state, action] = useActionState(createSectionAction, initialState);

  return (
    <SetupFormShell
      id="sections"
      step="Step 2"
      title="Sections"
      description="Create reusable section labels such as A, B, Red, or Morning."
      listHref="/academia/sections"
      state={state}
    >
      <form action={action} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FormField id="setup-section-code" label="Code" required error={errorFor(state, "code")}>
          <input id="setup-section-code" name="code" placeholder="A" required className="min-h-11 w-full uppercase" />
        </FormField>
        <FormField id="setup-section-name" label="Name" required error={errorFor(state, "name")}>
          <input id="setup-section-name" name="name" placeholder="Section A" required className="min-h-11 w-full" />
        </FormField>
        <FormField id="setup-section-sort" label="Sort Order" helpText="Lower numbers appear first." error={errorFor(state, "sortOrder")}>
          <input id="setup-section-sort" name="sortOrder" type="number" min={0} max={10000} placeholder="1" className="min-h-11 w-full" />
        </FormField>
        <FormField id="setup-section-description" label="Description" error={errorFor(state, "description")}>
          <input id="setup-section-description" name="description" placeholder="Optional" className="min-h-11 w-full" />
        </FormField>
        <input type="hidden" name="status" value="ACTIVE" />
        <div className="md:col-span-2 lg:col-span-4 lg:flex lg:justify-end">
          <SubmitButton pendingLabel="Adding section...">Add Section</SubmitButton>
        </div>
      </form>
    </SetupFormShell>
  );
}

export function CreateClassSectionSetupForm({
  classes,
  sections,
  teachers,
  activeBranchName,
  activeAcademicYearName
}: AcademicSetupFormsProps) {
  const [state, action] = useActionState(createClassSectionAction, initialState);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameEdited, setDisplayNameEdited] = useState(false);
  const hasContext = Boolean(activeBranchName && activeAcademicYearName);
  const hasPrerequisites = hasContext && classes.length > 0 && sections.length > 0;

  function updateDisplayName(nextClassId: string, nextSectionId: string) {
    if (displayNameEdited) return;
    const className = classes.find((item) => item.id === nextClassId)?.name;
    const sectionName = sections.find((item) => item.id === nextSectionId)?.name;
    setDisplayName([className, sectionName].filter(Boolean).join(" - "));
  }

  return (
    <SetupFormShell
      id="class-sections"
      step="Step 3"
      title="Class Sections"
      description="Combine one class and one section for the selected branch and active academic year."
      listHref="/academia/class-sections"
      state={state}
    >
      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
        <p><span className="font-semibold text-slate-700">Branch:</span> {activeBranchName ?? "Not selected"}</p>
        <p><span className="font-semibold text-slate-700">Academic year:</span> {activeAcademicYearName ?? "Not active"}</p>
      </div>
      {!hasPrerequisites ? (
        <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Select an active branch and academic year, then create at least one class and section before mapping them.
        </p>
      ) : null}
      <form action={action} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FormField id="setup-class-section-class" label="Class" required error={errorFor(state, "classId")}>
          <select
            id="setup-class-section-class"
            name="classId"
            value={classId}
            required
            disabled={!hasPrerequisites}
            onChange={(event) => {
              const nextClassId = event.target.value;
              setClassId(nextClassId);
              updateDisplayName(nextClassId, sectionId);
            }}
            className="min-h-11 w-full"
          >
            <option value="">Select class</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FormField>
        <FormField id="setup-class-section-section" label="Section" required error={errorFor(state, "sectionId")}>
          <select
            id="setup-class-section-section"
            name="sectionId"
            value={sectionId}
            required
            disabled={!hasPrerequisites}
            onChange={(event) => {
              const nextSectionId = event.target.value;
              setSectionId(nextSectionId);
              updateDisplayName(classId, nextSectionId);
            }}
            className="min-h-11 w-full"
          >
            <option value="">Select section</option>
            {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FormField>
        <FormField id="setup-class-section-name" label="Display Name" required error={errorFor(state, "displayName")}>
          <input
            id="setup-class-section-name"
            name="displayName"
            value={displayName}
            required
            disabled={!hasPrerequisites}
            onChange={(event) => {
              setDisplayNameEdited(true);
              setDisplayName(event.target.value);
            }}
            placeholder="Class 1 - A"
            className="min-h-11 w-full"
          />
        </FormField>
        <FormField id="setup-class-section-teacher" label="Class Teacher" helpText="Optional. Only active teachers with branch access are listed." error={errorFor(state, "classTeacherUserId")}>
          <select id="setup-class-section-teacher" name="classTeacherUserId" disabled={!hasPrerequisites} defaultValue="" className="min-h-11 w-full">
            <option value="">Assign later</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </FormField>
        <FormField id="setup-class-section-capacity" label="Capacity" helpText="Optional class capacity." error={errorFor(state, "capacity")}>
          <input id="setup-class-section-capacity" name="capacity" type="number" min={1} max={500} disabled={!hasPrerequisites} className="min-h-11 w-full" />
        </FormField>
        <input type="hidden" name="status" value="ACTIVE" />
        <div className="flex items-end lg:justify-end">
          <SubmitButton disabled={!hasPrerequisites} pendingLabel="Creating class section...">
            Create Class Section
          </SubmitButton>
        </div>
      </form>
    </SetupFormShell>
  );
}

export function CreateSubjectSetupForm() {
  const [state, action] = useActionState(createSubjectAction, initialState);

  return (
    <SetupFormShell
      id="subjects"
      step="Step 4"
      title="Subjects"
      description="Keep a simple subject master for future timetable, teaching assignment, GradeBook, and reporting workflows."
      listHref="/academia/subjects"
      state={state}
    >
      <form action={action} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FormField id="setup-subject-code" label="Code" required error={errorFor(state, "code")}>
          <input id="setup-subject-code" name="code" placeholder="MATH" required className="min-h-11 w-full uppercase" />
        </FormField>
        <FormField id="setup-subject-name" label="Name" required error={errorFor(state, "name")}>
          <input id="setup-subject-name" name="name" placeholder="Mathematics" required className="min-h-11 w-full" />
        </FormField>
        <FormField id="setup-subject-type" label="Type" error={errorFor(state, "type")}>
          <select id="setup-subject-type" name="type" defaultValue="CORE" className="min-h-11 w-full">
            <option value="CORE">Core</option>
            <option value="ELECTIVE">Elective</option>
            <option value="OPTIONAL">Optional</option>
            <option value="CO_CURRICULAR">Co-curricular</option>
          </select>
        </FormField>
        <FormField id="setup-subject-description" label="Description" error={errorFor(state, "description")}>
          <input id="setup-subject-description" name="description" placeholder="Optional" className="min-h-11 w-full" />
        </FormField>
        <input type="hidden" name="status" value="ACTIVE" />
        <div className="md:col-span-2 lg:col-span-4 lg:flex lg:justify-end">
          <SubmitButton pendingLabel="Adding subject...">Add Subject</SubmitButton>
        </div>
      </form>
    </SetupFormShell>
  );
}
