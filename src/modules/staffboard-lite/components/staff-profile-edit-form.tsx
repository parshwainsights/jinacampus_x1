"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/forms/password-input";
import {
  FieldErrorMessage,
  FormField,
  FormMessage,
  getFieldError
} from "@/components/ui/form-primitives";
import {
  createStaffLoginAccessAction,
  deactivateStaffProfileAction,
  disableStaffLoginAccessAction,
  updateStaffProfileAction,
  type StaffProfileFormActionState
} from "@/modules/staffboard-lite/actions/staff-profile.actions";

type StaffType =
  | "TEACHER"
  | "ADMIN"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "DRIVER"
  | "HELPER"
  | "SECURITY"
  | "PEON"
  | "CLEANING_STAFF"
  | "MANAGEMENT"
  | "OTHER";
type EmploymentStatus = "ACTIVE" | "INACTIVE" | "RESIGNED" | "TERMINATED";

type BranchOption = {
  id: string;
  name: string;
};

type StaffProfileRecord = {
  id: string;
  branchId: string;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  staffType: StaffType;
  designation: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  joiningDate: string | null;
  employmentStatus: EmploymentStatus;
  user: {
    id: string;
    email: string;
    status: string;
    passwordCredential: { mustChange: boolean } | null;
    roleAssignments: Array<{ role: { code: string; name: string } }>;
  } | null;
};

const initialState: StaffProfileFormActionState = { ok: false };
const staffTypeOptions: StaffType[] = [
  "TEACHER",
  "ADMIN",
  "ACCOUNTANT",
  "LIBRARIAN",
  "DRIVER",
  "HELPER",
  "SECURITY",
  "PEON",
  "CLEANING_STAFF",
  "MANAGEMENT",
  "OTHER"
];
const employmentStatusOptions: EmploymentStatus[] = ["ACTIVE", "INACTIVE", "RESIGNED", "TERMINATED"];
const loginRoleOptions = [
  { value: "STAFF", label: "Staff" },
  { value: "TEACHER", label: "Teacher" },
  { value: "CLASS_TEACHER", label: "Class Teacher" },
  { value: "OFFICE_STAFF", label: "Office Staff" }
] as const;

function fieldError(state: StaffProfileFormActionState, name: string) {
  return getFieldError(state.fieldErrors, name);
}

function defaultLoginRole(staffType: StaffType) {
  if (staffType === "TEACHER") return "TEACHER";
  if (staffType === "ADMIN" || staffType === "ACCOUNTANT" || staffType === "MANAGEMENT") return "OFFICE_STAFF";
  return "STAFF";
}

export function StaffProfileEditForm({
  branches,
  canDeactivate = false,
  staffProfile
}: {
  branches: BranchOption[];
  canDeactivate?: boolean;
  staffProfile: StaffProfileRecord;
}) {
  const [state, formAction, pending] = useActionState(updateStaffProfileAction, initialState);
  const [loginAccessState, loginAccessFormAction, loginAccessPending] = useActionState(createStaffLoginAccessAction, initialState);
  const [disableLoginState, disableLoginFormAction, disableLoginPending] = useActionState(disableStaffLoginAccessAction, initialState);
  const [deactivateState, deactivateFormAction, deactivatePending] = useActionState(deactivateStaffProfileAction, initialState);

  return (
    <div className="space-y-6">
    <form action={formAction} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit Staff Profile</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">Update a teaching or non-teaching staff profile for an accessible branch.</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Fields marked Required must be completed before saving.</p>
        </div>
        <Link href="/staffboard/staff" className="premium-secondary-button w-full sm:w-auto">
          Cancel
        </Link>
      </div>
      <FormMessage state={state} />
      <div className="premium-card p-5">
        <input type="hidden" name="staffId" value={staffProfile.id} />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="staff-branch" label="Branch" required helpText="Only accessible branches are available." error={fieldError(state, "branchId")}>
            <select id="staff-branch" name="branchId" defaultValue={staffProfile.branchId} required className="min-h-11 w-full">
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </FormField>
          <FormField id="staff-employee-code" label="Employee Code" required helpText="Unique staff code used by the school." error={fieldError(state, "employeeCode")}>
            <input id="staff-employee-code" name="employeeCode" defaultValue={staffProfile.employeeCode} required aria-invalid={Boolean(fieldError(state, "employeeCode"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-first-name" label="First Name" required error={fieldError(state, "firstName")}>
            <input id="staff-first-name" name="firstName" defaultValue={staffProfile.firstName} required aria-invalid={Boolean(fieldError(state, "firstName"))} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-middle-name" label="Middle Name" error={fieldError(state, "middleName")}>
            <input id="staff-middle-name" name="middleName" defaultValue={staffProfile.middleName ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-last-name" label="Last Name" error={fieldError(state, "lastName")}>
            <input id="staff-last-name" name="lastName" defaultValue={staffProfile.lastName ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-type" label="Staff Type" required helpText="Choose the closest teaching or non-teaching category." error={fieldError(state, "staffType")}>
            <select id="staff-type" name="staffType" defaultValue={staffProfile.staffType} required className="min-h-11 w-full">
              {staffTypeOptions.map((staffType) => <option key={staffType} value={staffType}>{staffType.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
          <FormField id="staff-designation" label="Designation" error={fieldError(state, "designation")}>
            <input id="staff-designation" name="designation" defaultValue={staffProfile.designation ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-department" label="Department" helpText="Examples: Academics, Admin, Transport." error={fieldError(state, "department")}>
            <input id="staff-department" name="department" defaultValue={staffProfile.department ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-phone" label="Mobile" helpText="Use a valid Indian mobile number when provided." error={fieldError(state, "phone")}>
            <input id="staff-phone" name="phone" type="tel" defaultValue={staffProfile.phone ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-email" label="Email" error={fieldError(state, "email")}>
            <input id="staff-email" name="email" type="email" defaultValue={staffProfile.email ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-joining-date" label="Joining Date" error={fieldError(state, "joiningDate")}>
            <input id="staff-joining-date" name="joiningDate" type="date" defaultValue={staffProfile.joiningDate ?? ""} className="min-h-11 w-full" />
          </FormField>
          <FormField id="staff-employment-status" label="Employment Status" error={fieldError(state, "employmentStatus")}>
            <select id="staff-employment-status" name="employmentStatus" defaultValue={staffProfile.employmentStatus} className="min-h-11 w-full">
              {employmentStatusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
          </FormField>
        </div>
        <FieldErrorMessage id="staff-form-error" message={fieldError(state, "form")} />
        <div className="mt-5 flex justify-end">
          <button disabled={pending} className="min-h-11 w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
    <section className="premium-card p-5 motion-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-950">Login Access</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Staff sign in with School ID, email, and password. Profiles can exist without app login access.
          </p>
        </div>
        {staffProfile.user ? (
          <span className="premium-muted-chip border-emerald-200 bg-emerald-50 text-emerald-700">Enabled</span>
        ) : (
          <span className="premium-muted-chip">No app access</span>
        )}
      </div>
      {staffProfile.user ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Login Email</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{staffProfile.user.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Account Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{staffProfile.user.status.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password Change</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{staffProfile.user.passwordCredential?.mustChange ? "Required" : "Not required"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Roles</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {staffProfile.user.roleAssignments.map((assignment) => assignment.role.name).join(", ") || "No active role"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/campus-core/users/${staffProfile.user.id}/reset-password`} className="premium-primary-button w-full sm:w-auto">
              Reset Password
            </Link>
            <Link href={`/campus-core/users/${staffProfile.user.id}`} className="premium-secondary-button w-full sm:w-auto">
              Open User Account
            </Link>
          </div>
          <FormMessage state={disableLoginState} />
          <form action={disableLoginFormAction} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <input type="hidden" name="staffId" value={staffProfile.id} />
            <label className="flex items-start gap-3 text-sm text-amber-950">
              <input
                type="checkbox"
                name="confirmDisableLoginAccess"
                className="mt-1 size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-200"
                disabled={disableLoginPending}
              />
              <span>Disable this staff member's app login access and revoke active sessions.</span>
            </label>
            <FieldErrorMessage id="disable-login-access-error" message={fieldError(disableLoginState, "confirmDisableLoginAccess")} />
            <button type="submit" disabled={disableLoginPending} className="premium-danger-button mt-4 w-full sm:w-auto premium-focus">
              {disableLoginPending ? "Disabling..." : "Disable Login Access"}
            </button>
          </form>
        </div>
      ) : (
        <form action={loginAccessFormAction} className="mt-5 space-y-4">
          <input type="hidden" name="staffId" value={staffProfile.id} />
          <FormMessage state={loginAccessState} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="staff-login-email" label="Login Email" required helpText="Required because current login uses email, not mobile number." error={fieldError(loginAccessState, "email")}>
              <input id="staff-login-email" name="email" type="email" defaultValue={staffProfile.email ?? ""} required className="min-h-11 w-full" />
            </FormField>
            <FormField id="staff-login-phone" label="Mobile" helpText="Stored on the user account when provided; not used as a login identifier yet." error={fieldError(loginAccessState, "phone")}>
              <input id="staff-login-phone" name="phone" type="tel" defaultValue={staffProfile.phone ?? ""} className="min-h-11 w-full" />
            </FormField>
            <FormField id="staff-login-role" label="Login Role" required helpText="Restricted to non-platform school roles." error={fieldError(loginAccessState, "loginRoleCode")}>
              <select id="staff-login-role" name="loginRoleCode" defaultValue={defaultLoginRole(staffProfile.staffType)} required className="min-h-11 w-full">
                {loginRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </FormField>
            <FormField id="staff-login-initial-password" label="Temporary Password" required error={fieldError(loginAccessState, "initialPassword")}>
              <PasswordInput id="staff-login-initial-password" name="initialPassword" autoComplete="new-password" required className="min-h-11 w-full" />
            </FormField>
            <FormField id="staff-login-confirm-password" label="Confirm Temporary Password" required error={fieldError(loginAccessState, "confirmInitialPassword")}>
              <PasswordInput id="staff-login-confirm-password" name="confirmInitialPassword" autoComplete="new-password" required className="min-h-11 w-full" />
            </FormField>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            The temporary password is never displayed after submission. Use CampusCore reset password if it needs to be rotated.
          </p>
          <button type="submit" disabled={loginAccessPending} className="premium-primary-button w-full sm:w-auto">
            {loginAccessPending ? "Creating Login..." : "Create Login Access"}
          </button>
        </form>
      )}
    </section>
    <section className="premium-card border-rose-200/80 bg-rose-50/70 p-5 motion-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-rose-950">Deactivate Staff Profile</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">
            This marks the staff profile inactive for operations while preserving attendance history and audit records.
          </p>
        </div>
        <span className="premium-muted-chip border-rose-200 bg-white/70 text-rose-700">No hard delete</span>
      </div>
      {canDeactivate ? <FormMessage state={deactivateState} /> : null}
      {canDeactivate ? (
        <form action={deactivateFormAction} className="mt-5 space-y-4">
          <input type="hidden" name="staffId" value={staffProfile.id} />
          <label className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white/80 p-3 text-sm text-rose-900">
            <input
              type="checkbox"
              name="confirmDeactivation"
              className="mt-1 size-4 rounded border-rose-300 text-rose-600 focus:ring-rose-200"
              disabled={deactivatePending || staffProfile.employmentStatus === "INACTIVE"}
            />
            <span>I understand this will deactivate the staff profile and keep historical records.</span>
          </label>
          <button
            type="submit"
            disabled={deactivatePending || staffProfile.employmentStatus === "INACTIVE"}
            className="premium-danger-button w-full sm:w-auto premium-focus"
          >
            {staffProfile.employmentStatus === "INACTIVE" ? "Already Inactive" : deactivatePending ? "Deactivating..." : "Deactivate Staff Profile"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-rose-200 bg-white/70 p-4 text-sm text-rose-700">
          You do not have permission to deactivate staff profiles.
        </p>
      )}
    </section>
    </div>
  );
}
