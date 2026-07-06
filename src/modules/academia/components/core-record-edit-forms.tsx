"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import {
  FieldErrorMessage,
  FormField,
  FormMessage,
  getFieldError
} from "@/components/ui/form-primitives";
import {
  cancelEnrollmentAction,
  deactivateClassAction,
  deactivateSectionAction,
  deactivateStudentAction,
  deactivateSubjectAction,
  updateClassAction,
  updateEnrollmentAction,
  updateGuardianAction,
  updateSectionAction,
  updateSubjectAction,
  type ProfileFormActionState
} from "@/modules/academia/actions/profile.actions";
import { StudentRegistrationForm } from "@/modules/academia/components/student-registration-form";

type LifecycleAction = (
  state: ProfileFormActionState,
  formData: FormData
) => Promise<ProfileFormActionState>;

type AcademicRecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type SubjectType = "CORE" | "ELECTIVE" | "OPTIONAL" | "CO_CURRICULAR";
type EnrollmentStatus = "ACTIVE" | "PROMOTED" | "TRANSFERRED" | "WITHDRAWN" | "CANCELLED" | "COMPLETED";

type BranchOption = {
  id: string;
  name: string;
};

type SimpleAcademicRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: AcademicRecordStatus;
};

type SubjectRecord = {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  description: string | null;
  status: AcademicRecordStatus;
};

type StudentRecord = {
  id: string;
  branchId: string;
  admissionNumber: string;
  admissionDate: string | null;
  fullName: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  displayName: string | null;
  dateOfBirth: string | null;
  gender: string;
  bloodGroup: string | null;
  fatherName: string | null;
  fatherOccupation: string | null;
  motherName: string | null;
  guardianName: string | null;
  aadhaarMasked: string | null;
  familyIdNumber: string | null;
  sssmIdNumber: string | null;
  apaarIdNumber: string | null;
  religion: string | null;
  caste: string | null;
  category: string | null;
  nationality: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bankAccountMasked: string | null;
  bankBranchName: string | null;
  ifscCode: string | null;
  status: string;
  joinedAt: string | null;
  leftAt: string | null;
};

type GuardianRecord = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

type EnrollmentRecord = {
  id: string;
  studentName: string;
  admissionNumber: string;
  branchName: string;
  academicYearName: string;
  classSectionName: string;
  rollNumber: string | null;
  status: EnrollmentStatus;
  enrolledOn: string | null;
  leftOn: string | null;
};

const initialState: ProfileFormActionState = { ok: false };
const academicStatusOptions: AcademicRecordStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const subjectTypeOptions: SubjectType[] = ["CORE", "ELECTIVE", "OPTIONAL", "CO_CURRICULAR"];
const enrollmentStatusOptions: EnrollmentStatus[] = ["ACTIVE", "PROMOTED", "TRANSFERRED", "WITHDRAWN", "CANCELLED", "COMPLETED"];

function fieldError(state: ProfileFormActionState, name: string) {
  return getFieldError(state.fieldErrors, name);
}

function FormShell({
  title,
  description,
  backHref,
  state,
  pending,
  children
}: {
  title: string;
  description: string;
  backHref: string;
  state: ProfileFormActionState;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Fields marked Required must be completed before saving.</p>
        </div>
        <Link href={backHref} className="premium-secondary-button w-full sm:w-auto">
          Cancel
        </Link>
      </div>
      <FormMessage state={state} />
      <div className="premium-card p-5">
        {children}
        <FieldErrorMessage id="form-error" message={fieldError(state, "form")} />
        <div className="mt-5 flex justify-end">
          <button disabled={pending} className="min-h-11 w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LifecycleActionCard({
  action,
  idName,
  idValue,
  title,
  description,
  confirmText,
  buttonLabel,
  pendingLabel,
  disabled = false,
  disabledLabel = "Already inactive"
}: {
  action: LifecycleAction;
  idName: string;
  idValue: string;
  title: string;
  description: string;
  confirmText: string;
  buttonLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="premium-card border-rose-200/80 bg-rose-50/70 p-5 motion-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-rose-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">{description}</p>
        </div>
        <span className="premium-muted-chip border-rose-200 bg-white/70 text-rose-700">No hard delete</span>
      </div>
      <FormMessage state={state} />
      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name={idName} value={idValue} />
        <label className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white/80 p-3 text-sm text-rose-900">
          <input
            type="checkbox"
            name="confirmLifecycleAction"
            className="mt-1 size-4 rounded border-rose-300 text-rose-600 focus:ring-rose-200"
            disabled={disabled || pending}
          />
          <span>{confirmText}</span>
        </label>
        <button type="submit" disabled={disabled || pending} className="premium-danger-button w-full sm:w-auto premium-focus">
          {disabled ? disabledLabel : pending ? pendingLabel : buttonLabel}
        </button>
      </form>
    </section>
  );
}

export function ClassEditForm({ record }: { record: SimpleAcademicRecord }) {
  const [state, formAction, pending] = useActionState(updateClassAction, initialState);

  return (
    <div className="space-y-6">
    <form action={formAction}>
      <FormShell title="Edit Class" description="Update an academic class level." backHref="/academia/classes" state={state} pending={pending}>
        <input type="hidden" name="classId" value={record.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="class-code" label="Code" required helpText="Short code used in lists and reports." error={fieldError(state, "code")}>
            <input id="class-code" name="code" defaultValue={record.code} required aria-invalid={Boolean(fieldError(state, "code"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="class-name" label="Name" required helpText="School-friendly class name, such as Class 1." error={fieldError(state, "name")}>
            <input id="class-name" name="name" defaultValue={record.name} required aria-invalid={Boolean(fieldError(state, "name"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="class-sort-order" label="Sort Order" helpText="Lower numbers appear first." error={fieldError(state, "sortOrder")}>
            <input id="class-sort-order" name="sortOrder" type="number" min={0} max={10000} defaultValue={record.sortOrder} className="min-h-11 w-full" />
          </FormField>
          <FormField id="class-status" label="Status" error={fieldError(state, "status")}>
            <select id="class-status" name="status" defaultValue={record.status} className="min-h-11 w-full">
              {academicStatusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="class-description" label="Description" className="md:col-span-2" error={fieldError(state, "description")}>
            <input id="class-description" name="description" defaultValue={record.description ?? ""} className="min-h-11 w-full" />
          </FormField>
        </div>
      </FormShell>
    </form>
    <LifecycleActionCard
      action={deactivateClassAction}
      idName="classId"
      idValue={record.id}
      title="Deactivate Class"
      description="Deactivation hides this class from active academic setup without deleting historical records."
      confirmText={`I understand ${record.name} will be marked inactive.`}
      buttonLabel="Deactivate Class"
      pendingLabel="Deactivating..."
      disabled={record.status === "INACTIVE"}
    />
    </div>
  );
}

export function SectionEditForm({ record }: { record: SimpleAcademicRecord }) {
  const [state, formAction, pending] = useActionState(updateSectionAction, initialState);

  return (
    <div className="space-y-6">
    <form action={formAction}>
      <FormShell title="Edit Section" description="Update a reusable section label." backHref="/academia/sections" state={state} pending={pending}>
        <input type="hidden" name="sectionId" value={record.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="section-code" label="Code" required helpText="Short section code such as A, B, or RED." error={fieldError(state, "code")}>
            <input id="section-code" name="code" defaultValue={record.code} required aria-invalid={Boolean(fieldError(state, "code"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="section-name" label="Name" required helpText="Readable section name shown to office users." error={fieldError(state, "name")}>
            <input id="section-name" name="name" defaultValue={record.name} required aria-invalid={Boolean(fieldError(state, "name"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="section-sort-order" label="Sort Order" helpText="Lower numbers appear first." error={fieldError(state, "sortOrder")}>
            <input id="section-sort-order" name="sortOrder" type="number" min={0} max={10000} defaultValue={record.sortOrder} className="min-h-11 w-full" />
          </FormField>
          <FormField id="section-status" label="Status" error={fieldError(state, "status")}>
            <select id="section-status" name="status" defaultValue={record.status} className="min-h-11 w-full">
              {academicStatusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="section-description" label="Description" className="md:col-span-2" error={fieldError(state, "description")}>
            <input id="section-description" name="description" defaultValue={record.description ?? ""} className="min-h-11 w-full" />
          </FormField>
        </div>
      </FormShell>
    </form>
    <LifecycleActionCard
      action={deactivateSectionAction}
      idName="sectionId"
      idValue={record.id}
      title="Deactivate Section"
      description="Deactivation keeps section history while removing the section from active setup."
      confirmText={`I understand ${record.name} will be marked inactive.`}
      buttonLabel="Deactivate Section"
      pendingLabel="Deactivating..."
      disabled={record.status === "INACTIVE"}
    />
    </div>
  );
}

export function SubjectEditForm({ record }: { record: SubjectRecord }) {
  const [state, formAction, pending] = useActionState(updateSubjectAction, initialState);

  return (
    <div className="space-y-6">
    <form action={formAction}>
      <FormShell title="Edit Subject" description="Update an academic or co-curricular subject." backHref="/academia/subjects" state={state} pending={pending}>
        <input type="hidden" name="subjectId" value={record.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="subject-code" label="Code" required helpText="Short subject code used in timetables and reports." error={fieldError(state, "code")}>
            <input id="subject-code" name="code" defaultValue={record.code} required aria-invalid={Boolean(fieldError(state, "code"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="subject-name" label="Name" required helpText="Readable subject name shown to staff." error={fieldError(state, "name")}>
            <input id="subject-name" name="name" defaultValue={record.name} required aria-invalid={Boolean(fieldError(state, "name"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="subject-type" label="Type" helpText="Choose how this subject should be grouped." error={fieldError(state, "type")}>
            <select id="subject-type" name="type" defaultValue={record.type} className="min-h-11 w-full">
              {subjectTypeOptions.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="subject-status" label="Status" error={fieldError(state, "status")}>
            <select id="subject-status" name="status" defaultValue={record.status} className="min-h-11 w-full">
              {academicStatusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="subject-description" label="Description" className="md:col-span-2" error={fieldError(state, "description")}>
            <input id="subject-description" name="description" defaultValue={record.description ?? ""} className="min-h-11 w-full" />
          </FormField>
        </div>
      </FormShell>
    </form>
    <LifecycleActionCard
      action={deactivateSubjectAction}
      idName="subjectId"
      idValue={record.id}
      title="Deactivate Subject"
      description="Deactivation keeps subject history while removing the subject from active setup."
      confirmText={`I understand ${record.name} will be marked inactive.`}
      buttonLabel="Deactivate Subject"
      pendingLabel="Deactivating..."
      disabled={record.status === "INACTIVE"}
    />
    </div>
  );
}

export function StudentEditForm({ branches, student }: { branches: BranchOption[]; student: StudentRecord }) {
  return (
    <div className="space-y-6">
    <div className="premium-glass-panel p-4">
      <div className="mb-5">
        <Link href="/academia/students" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
          Back to students
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Edit Student Registration</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Update admission-sheet details for an accessible branch. Sensitive identity and bank inputs are stored as masked references only.
        </p>
      </div>
      <StudentRegistrationForm mode="edit" branchOptions={branches} student={student} />
    </div>
    <LifecycleActionCard
      action={deactivateStudentAction}
      idName="studentId"
      idValue={student.id}
      title="Deactivate Student"
      description="Deactivation keeps the student record and attendance history but removes the student from active workflows."
      confirmText={`I understand ${student.displayName ?? student.firstName} will be marked inactive.`}
      buttonLabel="Deactivate Student"
      pendingLabel="Deactivating..."
      disabled={student.status === "INACTIVE"}
    />
    </div>
  );
}

export function GuardianEditForm({ guardian }: { guardian: GuardianRecord }) {
  const [state, formAction, pending] = useActionState(updateGuardianAction, initialState);

  return (
    <form action={formAction}>
      <FormShell title="Edit Guardian" description="Update a parent or guardian contact profile." backHref="/academia/guardians" state={state} pending={pending}>
        <input type="hidden" name="guardianId" value={guardian.id} />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="guardian-first-name" label="First Name" required error={fieldError(state, "firstName")}>
            <input id="guardian-first-name" name="firstName" defaultValue={guardian.firstName} required aria-invalid={Boolean(fieldError(state, "firstName"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-middle-name" label="Middle Name" error={fieldError(state, "middleName")}>
            <input id="guardian-middle-name" name="middleName" defaultValue={guardian.middleName ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-last-name" label="Last Name" error={fieldError(state, "lastName")}>
            <input id="guardian-last-name" name="lastName" defaultValue={guardian.lastName ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-display-name" label="Display Name" helpText="Optional name shown in guardian lists." error={fieldError(state, "displayName")}>
            <input id="guardian-display-name" name="displayName" defaultValue={guardian.displayName ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-phone" label="Mobile" helpText="Use a valid Indian mobile number when provided." error={fieldError(state, "phone")}>
            <input id="guardian-phone" name="phone" type="tel" defaultValue={guardian.phone ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-email" label="Email" error={fieldError(state, "email")}>
            <input id="guardian-email" name="email" type="email" defaultValue={guardian.email ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-occupation" label="Occupation" error={fieldError(state, "occupation")}>
            <input id="guardian-occupation" name="occupation" defaultValue={guardian.occupation ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-address-line-1" label="Address Line 1" className="md:col-span-2" error={fieldError(state, "addressLine1")}>
            <input id="guardian-address-line-1" name="addressLine1" defaultValue={guardian.addressLine1 ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-address-line-2" label="Address Line 2" className="md:col-span-2" error={fieldError(state, "addressLine2")}>
            <input id="guardian-address-line-2" name="addressLine2" defaultValue={guardian.addressLine2 ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-city" label="City" error={fieldError(state, "city")}>
            <input id="guardian-city" name="city" defaultValue={guardian.city ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-state" label="State" error={fieldError(state, "state")}>
            <input id="guardian-state" name="state" defaultValue={guardian.state ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-postal-code" label="Postal Code" error={fieldError(state, "postalCode")}>
            <input id="guardian-postal-code" name="postalCode" defaultValue={guardian.postalCode ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="guardian-country" label="Country" error={fieldError(state, "country")}>
            <input id="guardian-country" name="country" defaultValue={guardian.country ?? "India"} className="min-h-11 w-full" />
          </FormField>
        </div>
      </FormShell>
    </form>
  );
}

export function EnrollmentEditForm({ enrollment }: { enrollment: EnrollmentRecord }) {
  const [state, formAction, pending] = useActionState(updateEnrollmentAction, initialState);

  return (
    <div className="space-y-6">
    <form action={formAction}>
      <FormShell title="Edit Enrollment" description="Update roll number, enrollment dates, and enrollment status while keeping the student and class-section scope stable." backHref="/academia/enrollments" state={state} pending={pending}>
        <input type="hidden" name="enrollmentId" value={enrollment.id} />
        <div className="grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Student</p>
            <p className="mt-1 font-medium text-slate-900">{enrollment.studentName}</p>
            <p className="text-xs text-slate-500">Admission {enrollment.admissionNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Class Section</p>
            <p className="mt-1 font-medium text-slate-900">{enrollment.classSectionName}</p>
            <p className="text-xs text-slate-500">{enrollment.branchName} - {enrollment.academicYearName}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField id="enrollment-roll-number" label="Roll Number" helpText="Optional roll number within the class-section." error={fieldError(state, "rollNumber")}>
            <input id="enrollment-roll-number" name="rollNumber" defaultValue={enrollment.rollNumber ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="enrollment-status" label="Status" error={fieldError(state, "status")}>
            <select id="enrollment-status" name="status" defaultValue={enrollment.status} className="min-h-11 w-full">
              {enrollmentStatusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="enrollment-enrolled-on" label="Enrolled On" required error={fieldError(state, "enrolledOn")}>
            <input id="enrollment-enrolled-on" name="enrolledOn" type="date" defaultValue={enrollment.enrolledOn ?? ""} required className="min-h-11 w-full" />
          </FormField>
          <FormField id="enrollment-left-on" label="Left On" helpText="Leave blank while the student remains enrolled." error={fieldError(state, "leftOn")}>
            <input id="enrollment-left-on" name="leftOn" type="date" defaultValue={enrollment.leftOn ?? ""} className="min-h-11 w-full" />
          </FormField>
        </div>
      </FormShell>
    </form>
    <LifecycleActionCard
      action={cancelEnrollmentAction}
      idName="enrollmentId"
      idValue={enrollment.id}
      title="Cancel Enrollment"
      description="Cancellation keeps the enrollment record for audit and reports while removing it from active attendance workflows."
      confirmText={`I understand the enrollment for ${enrollment.studentName} will be cancelled.`}
      buttonLabel="Cancel Enrollment"
      pendingLabel="Cancelling..."
      disabled={enrollment.status === "CANCELLED"}
      disabledLabel="Already Cancelled"
    />
    </div>
  );
}
