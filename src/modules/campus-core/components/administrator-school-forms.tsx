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
  createSchoolAction,
  deactivateSchoolAction,
  deleteSchoolAction,
  reactivateSchoolAction,
  updateSchoolAction,
  updateSchoolIdAction
} from "@/modules/campus-core/administrator-actions";
import type { CampusCoreFormActionState } from "@/modules/campus-core/actions";

type SchoolStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

type SchoolFormRecord = {
  id: string;
  name: string;
  slug: string;
  status: SchoolStatus;
  legalName: string | null;
  supportEmail: string | null;
  institutions: Array<{
    displayName: string | null;
    logoUrl: string | null;
  }>;
};

const initialState: CampusCoreFormActionState = { ok: false };
const inputClassName = "min-h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm premium-focus";
const statusOptions: SchoolStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];

function fieldError(state: CampusCoreFormActionState, name: string) {
  return getFieldError(state.fieldErrors, name);
}

function FormActions({
  pending,
  label,
  pendingLabel,
  backHref
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  backHref: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Link href={backHref} className="premium-secondary-button w-full premium-focus sm:w-auto">
        Cancel
      </Link>
      <button disabled={pending} className="premium-primary-button w-full premium-focus sm:w-auto">
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}

export function CreateSchoolForm() {
  const [state, formAction, pending] = useActionState(createSchoolAction, initialState);

  return (
    <form action={formAction} className="premium-card space-y-6 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Create School</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Creates a school tenant with default institution, branch, roles, permissions, and attendance settings.
        </p>
      </div>
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="school-name" label="School Name" required error={fieldError(state, "name")}>
          <input id="school-name" name="name" required className={inputClassName} />
        </FormField>
        <FormField
          id="school-id"
          label="School ID"
          required
          helpText="Lowercase letters, numbers, and single hyphens only. This is the code users enter at login."
          error={fieldError(state, "schoolId")}
        >
          <input id="school-id" name="schoolId" required inputMode="text" autoCapitalize="none" className={inputClassName} />
        </FormField>
        <FormField id="institution-display-name" label="Institution Display Name" error={fieldError(state, "institutionDisplayName")}>
          <input id="institution-display-name" name="institutionDisplayName" className={inputClassName} />
        </FormField>
        <FormField id="school-support-email" label="Support Email" error={fieldError(state, "supportEmail")}>
          <input id="school-support-email" name="supportEmail" type="email" className={inputClassName} />
        </FormField>
        <FormField id="school-status" label="Status" error={fieldError(state, "status")}>
          <select id="school-status" name="status" defaultValue="ACTIVE" className={inputClassName}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </FormField>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Optional Principal Account</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Leave these fields blank if the principal will be created later from CampusCore user management.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField id="principal-first-name" label="Principal First Name" error={fieldError(state, "principalFirstName")}>
            <input id="principal-first-name" name="principalFirstName" autoComplete="given-name" className={inputClassName} />
          </FormField>
          <FormField id="principal-last-name" label="Principal Last Name" error={fieldError(state, "principalLastName")}>
            <input id="principal-last-name" name="principalLastName" autoComplete="family-name" className={inputClassName} />
          </FormField>
          <FormField id="principal-email" label="Principal Email" error={fieldError(state, "principalEmail")}>
            <input id="principal-email" name="principalEmail" type="email" autoComplete="username" className={inputClassName} />
          </FormField>
          <FormField
            id="principal-initial-password"
            label="Principal Initial Password"
            helpText="Minimum 8 characters. The account will be marked to change password later."
            error={fieldError(state, "principalInitialPassword")}
          >
            <PasswordInput id="principal-initial-password" name="principalInitialPassword" autoComplete="new-password" className={inputClassName} />
          </FormField>
          <FormField id="confirm-principal-initial-password" label="Confirm Principal Password" error={fieldError(state, "confirmPrincipalInitialPassword")}>
            <PasswordInput id="confirm-principal-initial-password" name="confirmPrincipalInitialPassword" autoComplete="new-password" className={inputClassName} />
          </FormField>
        </div>
      </section>
      <FieldErrorMessage id="create-school-form-error" message={fieldError(state, "form")} />
      <FormActions pending={pending} label="Create School" pendingLabel="Creating..." backHref="/administrator/schools" />
    </form>
  );
}

export function SchoolEditForm({ school }: { school: SchoolFormRecord }) {
  const [state, formAction, pending] = useActionState(updateSchoolAction, initialState);
  const institution = school.institutions[0] ?? null;

  return (
    <form action={formAction} className="premium-card space-y-6 p-5">
      <input type="hidden" name="tenantId" value={school.id} />
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Edit School Profile</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Update school identity and branding. School ID changes are handled separately and audited.
        </p>
      </div>
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="edit-school-name" label="School Name" required error={fieldError(state, "name")}>
          <input id="edit-school-name" name="name" defaultValue={school.name} required className={inputClassName} />
        </FormField>
        <FormField id="edit-school-legal-name" label="Legal Name" error={fieldError(state, "legalName")}>
          <input id="edit-school-legal-name" name="legalName" defaultValue={school.legalName ?? ""} className={inputClassName} />
        </FormField>
        <FormField id="edit-school-support-email" label="Support Email" error={fieldError(state, "supportEmail")}>
          <input id="edit-school-support-email" name="supportEmail" type="email" defaultValue={school.supportEmail ?? ""} className={inputClassName} />
        </FormField>
        <FormField id="edit-school-status" label="Status" error={fieldError(state, "status")}>
          <select id="edit-school-status" name="status" defaultValue={school.status} className={inputClassName}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </FormField>
        <FormField id="edit-institution-display-name" label="Institution Display Name" error={fieldError(state, "institutionDisplayName")}>
          <input id="edit-institution-display-name" name="institutionDisplayName" defaultValue={institution?.displayName ?? ""} className={inputClassName} />
        </FormField>
        <FormField id="edit-institution-logo-url" label="Institution Logo URL" error={fieldError(state, "institutionLogoUrl")}>
          <input id="edit-institution-logo-url" name="institutionLogoUrl" type="url" defaultValue={institution?.logoUrl ?? ""} className={inputClassName} />
        </FormField>
      </div>
      <FieldErrorMessage id="school-edit-form-error" message={fieldError(state, "form")} />
      <FormActions pending={pending} label="Save School" pendingLabel="Saving..." backHref={`/administrator/schools/${school.id}`} />
    </form>
  );
}

export function SchoolIdUpdateForm({ school }: { school: Pick<SchoolFormRecord, "id" | "slug"> }) {
  const [state, formAction, pending] = useActionState(updateSchoolIdAction, initialState);

  return (
    <form action={formAction} className="premium-card border-amber-200/80 bg-amber-50/70 p-5">
      <input type="hidden" name="tenantId" value={school.id} />
      <input type="hidden" name="currentSchoolId" value={school.slug} />
      <div>
        <h2 className="text-lg font-semibold text-amber-950">Update School ID</h2>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          Changing the School ID changes the login code/URL for this school.
        </p>
      </div>
      <div className="mt-4">
        <FormMessage state={state} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField id="current-school-id-display" label="Current School ID">
          <input id="current-school-id-display" value={school.slug} readOnly className={`${inputClassName} bg-white/60 text-slate-500`} />
        </FormField>
        <FormField id="new-school-id" label="New School ID" required error={fieldError(state, "newSchoolId")}>
          <input id="new-school-id" name="newSchoolId" required autoCapitalize="none" className={inputClassName} />
        </FormField>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-white/75 p-3 text-sm text-amber-950">
        <input type="checkbox" name="confirmSchoolIdChange" className="mt-1 size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-200" />
        <span>I understand school users must use the new School ID on future logins.</span>
      </label>
      <FieldErrorMessage id="school-id-form-error" message={fieldError(state, "confirmSchoolIdChange") ?? fieldError(state, "form")} />
      <div className="mt-4 flex justify-end">
        <button disabled={pending} className="premium-secondary-button w-full border-amber-300 text-amber-900 premium-focus sm:w-auto">
          {pending ? "Updating..." : "Update School ID"}
        </button>
      </div>
    </form>
  );
}

export function SchoolLifecycleActions({ school }: { school: Pick<SchoolFormRecord, "id" | "name" | "status"> }) {
  const [deactivateState, deactivateAction, deactivatePending] = useActionState(deactivateSchoolAction, initialState);
  const [reactivateState, reactivateAction, reactivatePending] = useActionState(reactivateSchoolAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSchoolAction, initialState);
  const isSuspended = school.status === "SUSPENDED";

  return (
    <section className="premium-card border-rose-200/80 bg-rose-50/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-rose-950">Lifecycle Controls</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">
            Deactivation is the normal operating control. Hard delete is only allowed for schools with no dependent data.
          </p>
        </div>
        <span className="premium-muted-chip border-rose-200 bg-white/70 text-rose-700">Audit logged</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form action={isSuspended ? reactivateAction : deactivateAction} className="rounded-2xl border border-rose-200 bg-white/75 p-4">
          <input type="hidden" name="tenantId" value={school.id} />
          <h3 className="text-sm font-semibold text-rose-950">{isSuspended ? "Reactivate School" : "Deactivate School"}</h3>
          <p className="mt-1 text-sm leading-6 text-rose-700">
            {isSuspended ? "Reactivate the school so users can sign in again." : "Suspend login for this school and revoke active sessions."}
          </p>
          <div className="mt-3">
            <FormMessage state={isSuspended ? reactivateState : deactivateState} />
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm text-rose-900">
            <input
              type="checkbox"
              name={isSuspended ? "confirmReactivation" : "confirmDeactivation"}
              className="mt-1 size-4 rounded border-rose-300 text-rose-600 focus:ring-rose-200"
            />
            <span>I confirm this lifecycle change for {school.name}.</span>
          </label>
          <button disabled={isSuspended ? reactivatePending : deactivatePending} className="premium-danger-button mt-4 w-full premium-focus sm:w-auto">
            {isSuspended
              ? reactivatePending ? "Reactivating..." : "Reactivate School"
              : deactivatePending ? "Deactivating..." : "Deactivate School"}
          </button>
        </form>
        <form action={deleteAction} className="rounded-2xl border border-rose-200 bg-white/75 p-4">
          <input type="hidden" name="tenantId" value={school.id} />
          <h3 className="text-sm font-semibold text-rose-950">Hard Delete</h3>
          <p className="mt-1 text-sm leading-6 text-rose-700">
            Hard delete is blocked when users, roles, branches, institutions, audit logs, or attendance data exist.
          </p>
          <div className="mt-3">
            <FormMessage state={deleteState} />
          </div>
          <FormField id="confirm-delete-school" label="Type DELETE SCHOOL" error={fieldError(deleteState, "confirmDelete")}>
            <input id="confirm-delete-school" name="confirmDelete" className={inputClassName} />
          </FormField>
          <button disabled={deletePending} className="premium-danger-button mt-4 w-full premium-focus sm:w-auto">
            {deletePending ? "Checking..." : "Delete If Safe"}
          </button>
        </form>
      </div>
    </section>
  );
}
