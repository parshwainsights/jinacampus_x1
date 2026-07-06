"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { FormField, FormMessage, getFieldError } from "@/components/ui/form-primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createStudentAction,
  updateStudentAction,
  type ProfileFormActionState
} from "@/modules/academia/actions/profile.actions";
import {
  INDIAN_STATE_OPTIONS,
  NATIONALITY_OPTIONS,
  STUDENT_CATEGORY_OPTIONS,
  STUDENT_RELIGION_OPTIONS
} from "@/modules/academia/student-registration-options";

type BranchOption = {
  id: string;
  name: string;
};

export type StudentRegistrationRecord = {
  id?: string;
  branchId?: string;
  admissionNumber?: string;
  admissionDate?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  guardianName?: string | null;
  aadhaarMasked?: string | null;
  familyIdNumber?: string | null;
  sssmIdNumber?: string | null;
  apaarIdNumber?: string | null;
  religion?: string | null;
  caste?: string | null;
  category?: string | null;
  nationality?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  bankAccountMasked?: string | null;
  bankBranchName?: string | null;
  ifscCode?: string | null;
  status?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
};

const initialState: ProfileFormActionState = { ok: false };

const genderOptions = [
  { value: "NOT_SPECIFIED", label: "Gender not specified" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" }
] as const;

const bloodGroupOptions = [
  { value: "", label: "Blood group optional" },
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
  { value: "UNKNOWN", label: "Unknown" }
] as const;

const studentStatusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "ALUMNI", label: "Alumni" }
] as const;

function fieldError(state: ProfileFormActionState, name: string) {
  return getFieldError(state.fieldErrors, name);
}

function value(record: StudentRegistrationRecord | undefined, key: keyof StudentRegistrationRecord, fallback = "") {
  const field = record?.[key];
  return typeof field === "string" ? field : fallback;
}

function resolvedFullName(record: StudentRegistrationRecord | undefined) {
  return (
    value(record, "fullName") ||
    value(record, "displayName") ||
    [value(record, "firstName"), value(record, "middleName"), value(record, "lastName")]
      .filter(Boolean)
      .join(" ")
  );
}

function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{children}</div>
    </section>
  );
}

function OptionalBadge({ children = "Can add later" }: { children?: string }) {
  return (
    <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </span>
  );
}

export function StudentRegistrationForm({
  mode,
  branchOptions,
  defaultBranchId,
  student
}: {
  mode: "create" | "edit";
  branchOptions: BranchOption[];
  defaultBranchId?: string;
  student?: StudentRegistrationRecord;
}) {
  const action = mode === "create" ? createStudentAction : updateStudentAction;
  const [state, formAction] = useActionState(action, initialState);
  const admissionNumberError = fieldError(state, "admissionNumber") ?? fieldError(state, "admissionNo");
  const isCreate = mode === "create";
  const hasExistingAadhaar = Boolean(student?.aadhaarMasked);
  const hasExistingBankAccount = Boolean(student?.bankAccountMasked);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      {student?.id ? <input type="hidden" name="studentId" value={student.id} /> : null}

      <FormSection
        title="Admission Details"
        description="Core school admission identifiers and branch context."
      >
        <FormField id="student-branch" label="Branch" required helpText="Only accessible branches are available." error={fieldError(state, "branchId")}>
          <select id="student-branch" name="branchId" required defaultValue={student?.branchId ?? defaultBranchId ?? ""} disabled={!branchOptions.length} className="min-h-11 w-full">
            {!branchOptions.length ? <option value="">No branch access</option> : null}
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </FormField>
        <FormField id="student-admission-number" label="Scholar / Admission No." required helpText="Unique school scholar or admission number." error={admissionNumberError}>
          <input id="student-admission-number" name="admissionNumber" defaultValue={value(student, "admissionNumber")} required aria-invalid={Boolean(admissionNumberError)} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-admission-date" label="Admission Date" required error={fieldError(state, "admissionDate")}>
          <input id="student-admission-date" name="admissionDate" type="date" defaultValue={value(student, "admissionDate")} required className="min-h-11 w-full" />
        </FormField>
      </FormSection>

      <FormSection
        title="Student Personal Details"
        description="Student identity used across class, attendance, and profile screens."
      >
        <FormField id="student-full-name" label="Full Name" required error={fieldError(state, "fullName")}>
          <input id="student-full-name" name="fullName" defaultValue={resolvedFullName(student)} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-date-of-birth" label="Date of Birth" required error={fieldError(state, "dateOfBirth")}>
          <input id="student-date-of-birth" name="dateOfBirth" type="date" defaultValue={value(student, "dateOfBirth")} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-gender" label="Gender" error={fieldError(state, "gender")}>
          <select id="student-gender" name="gender" defaultValue={value(student, "gender", "NOT_SPECIFIED")} className="min-h-11 w-full">
            {genderOptions.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
          </select>
        </FormField>
        <FormField id="student-display-name" label="Display Name" helpText="Optional preferred name shown in lists and reports." error={fieldError(state, "displayName")}>
          <input id="student-display-name" name="displayName" defaultValue={value(student, "displayName")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-blood-group" label="Blood Group" error={fieldError(state, "bloodGroup")}>
          <select id="student-blood-group" name="bloodGroup" defaultValue={value(student, "bloodGroup")} className="min-h-11 w-full">
            {bloodGroupOptions.map((bloodGroup) => <option key={bloodGroup.value} value={bloodGroup.value}>{bloodGroup.label}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormSection
        title="Parent / Guardian Details"
        description="Required parent names are captured here. Detailed contacts remain in Guardian records."
      >
        <FormField id="student-father-name" label="Father Name" required error={fieldError(state, "fatherName")}>
          <input id="student-father-name" name="fatherName" defaultValue={value(student, "fatherName")} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-father-occupation" label="Father Occupation" helpText={<><OptionalBadge /> Optional admission-sheet field.</>} error={fieldError(state, "fatherOccupation")}>
          <input id="student-father-occupation" name="fatherOccupation" defaultValue={value(student, "fatherOccupation")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-mother-name" label="Mother Name" required error={fieldError(state, "motherName")}>
          <input id="student-mother-name" name="motherName" defaultValue={value(student, "motherName")} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-guardian-name" label="Guardian Name" helpText={<><OptionalBadge /> Use only when different from parents.</>} error={fieldError(state, "guardianName")}>
          <input id="student-guardian-name" name="guardianName" defaultValue={value(student, "guardianName")} className="min-h-11 w-full" />
        </FormField>
      </FormSection>

      <FormSection
        title="Identity Documents"
        description="Sensitive values are used only to store masked references and last four digits."
      >
        <FormField
          id="student-aadhaar-number"
          label="Aadhaar Number"
          required={isCreate || !hasExistingAadhaar}
          helpText={hasExistingAadhaar ? `Stored as ${student?.aadhaarMasked}. Enter all 12 digits only to replace.` : "Enter 12 digits. Full Aadhaar is not stored."}
          error={fieldError(state, "aadhaarNumber")}
        >
          <input
            id="student-aadhaar-number"
            name="aadhaarNumber"
            inputMode="numeric"
            pattern="[0-9\\s-]{12,14}"
            required={isCreate || !hasExistingAadhaar}
            placeholder={hasExistingAadhaar ? "Optional replacement" : "1234 1234 1234"}
            className="min-h-11 w-full"
          />
        </FormField>
        <FormField id="student-family-id" label="Family ID" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "familyIdNumber")}>
          <input id="student-family-id" name="familyIdNumber" defaultValue={value(student, "familyIdNumber")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-sssm-id" label="SSSM ID" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "sssmIdNumber")}>
          <input id="student-sssm-id" name="sssmIdNumber" defaultValue={value(student, "sssmIdNumber")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-apaar-id" label="APAAR ID" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "apaarIdNumber")}>
          <input id="student-apaar-id" name="apaarIdNumber" defaultValue={value(student, "apaarIdNumber")} className="min-h-11 w-full" />
        </FormField>
      </FormSection>

      <FormSection
        title="Social / Demographic"
        description="Admission-sheet demographic fields used for school records."
      >
        <FormField id="student-religion" label="Religion" required error={fieldError(state, "religion")}>
          <select id="student-religion" name="religion" defaultValue={value(student, "religion")} required className="min-h-11 w-full">
            <option value="">Select religion</option>
            {STUDENT_RELIGION_OPTIONS.map((religion) => <option key={religion} value={religion}>{religion}</option>)}
          </select>
        </FormField>
        <FormField id="student-caste" label="Caste" required error={fieldError(state, "caste")}>
          <input id="student-caste" name="caste" defaultValue={value(student, "caste")} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-category" label="Category" required error={fieldError(state, "category")}>
          <select id="student-category" name="category" defaultValue={value(student, "category")} required className="min-h-11 w-full">
            <option value="">Select category</option>
            {STUDENT_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </FormField>
        <FormField id="student-nationality" label="Nationality" required error={fieldError(state, "nationality")}>
          <select id="student-nationality" name="nationality" defaultValue={value(student, "nationality", "India")} required className="min-h-11 w-full">
            {NATIONALITY_OPTIONS.map((nationality) => <option key={nationality} value={nationality}>{nationality}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormSection
        title="Address Details"
        description="City and state are required. Full address can be completed later."
      >
        <FormField id="student-current-address" label="Current Address" helpText={<OptionalBadge>Optional</OptionalBadge>} className="md:col-span-3" error={fieldError(state, "currentAddress")}>
          <textarea id="student-current-address" name="currentAddress" defaultValue={value(student, "currentAddress")} rows={3} className="min-h-24 w-full" />
        </FormField>
        <FormField id="student-permanent-address" label="Permanent Address" helpText={<OptionalBadge>Optional</OptionalBadge>} className="md:col-span-3" error={fieldError(state, "permanentAddress")}>
          <textarea id="student-permanent-address" name="permanentAddress" defaultValue={value(student, "permanentAddress")} rows={3} className="min-h-24 w-full" />
        </FormField>
        <FormField id="student-city" label="City" required helpText="City is a text field until a city master is added." error={fieldError(state, "city")}>
          <input id="student-city" name="city" defaultValue={value(student, "city")} required className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-state" label="State / UT" required error={fieldError(state, "state")}>
          <select id="student-state" name="state" defaultValue={value(student, "state")} required className="min-h-11 w-full">
            <option value="">Select state or UT</option>
            {INDIAN_STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </FormField>
        <FormField id="student-pincode" label="Pincode" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "pincode")}>
          <input id="student-pincode" name="pincode" inputMode="numeric" pattern="[0-9]{6}" defaultValue={value(student, "pincode")} className="min-h-11 w-full" />
        </FormField>
      </FormSection>

      <FormSection
        title="Bank Details"
        description="Optional bank fields. Full account number is converted to a masked value."
      >
        <FormField
          id="student-bank-account"
          label="Bank Account Number"
          helpText={hasExistingBankAccount ? `Stored as ${student?.bankAccountMasked}. Enter a number only to replace.` : <OptionalBadge>Optional</OptionalBadge>}
          error={fieldError(state, "bankAccountNumber")}
        >
          <input id="student-bank-account" name="bankAccountNumber" inputMode="numeric" placeholder={hasExistingBankAccount ? "Optional replacement" : ""} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-bank-branch" label="Bank Branch" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "bankBranchName")}>
          <input id="student-bank-branch" name="bankBranchName" defaultValue={value(student, "bankBranchName")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-ifsc" label="IFSC" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "ifscCode")}>
          <input id="student-ifsc" name="ifscCode" defaultValue={value(student, "ifscCode")} className="min-h-11 w-full uppercase" />
        </FormField>
      </FormSection>

      <FormSection
        title="System Details"
        description="Lifecycle fields used by reports and operational screens."
      >
        <FormField id="student-status" label="Status" error={fieldError(state, "status")}>
          <select id="student-status" name="status" defaultValue={value(student, "status", "ACTIVE")} className="min-h-11 w-full">
            {studentStatusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </FormField>
        <FormField id="student-joined-at" label="Joined At" helpText="Defaults to admission date if left blank." error={fieldError(state, "joinedAt")}>
          <input id="student-joined-at" name="joinedAt" type="date" defaultValue={value(student, "joinedAt")} className="min-h-11 w-full" />
        </FormField>
        <FormField id="student-left-at" label="Left At" helpText={<OptionalBadge>Optional</OptionalBadge>} error={fieldError(state, "leftAt")}>
          <input id="student-left-at" name="leftAt" type="date" defaultValue={value(student, "leftAt")} className="min-h-11 w-full" />
        </FormField>
      </FormSection>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/85 p-4 sm:flex-row sm:items-center sm:justify-end">
        <SubmitButton disabled={!branchOptions.length} pendingLabel={isCreate ? "Registering..." : "Saving..."}>
          {isCreate ? "Register Student" : "Save Student"}
        </SubmitButton>
      </div>
    </form>
  );
}
