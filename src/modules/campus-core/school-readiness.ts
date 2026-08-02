export type SchoolReadinessStatus = "ready" | "warning" | "blocked";

export type SchoolReadinessCheck = {
  id: string;
  title: string;
  status: SchoolReadinessStatus;
  summary: string;
  actionHref: string;
  actionLabel: string;
};

export type SchoolReadinessSnapshot = {
  activeInstitutionCount: number;
  brandedInstitutionCount: number;
  activeBranchCount: number;
  hasActiveAcademicYear: boolean;
  missingRoleCodes: string[];
  activePrincipalCount: number;
  activeStaffCount: number;
  unlinkedActiveStaffCount: number;
  disabledLinkedStaffCount: number;
  operationalUsersWithoutStaffProfileCount: number;
  mandatoryPasswordChangeCount: number;
  activeClassSectionCount: number;
  unassignedClassSectionCount: number;
  activeEnrollmentCount: number;
  configuredAttendanceBranchCount: number;
  qrEnabledBranchCount: number;
  passkeyConfiguration: "https-ready" | "local-only" | "invalid";
};

function check(
  id: string,
  title: string,
  status: SchoolReadinessStatus,
  summary: string,
  actionHref: string,
  actionLabel: string
): SchoolReadinessCheck {
  return { id, title, status, summary, actionHref, actionLabel };
}

export function buildSchoolReadinessReport(snapshot: SchoolReadinessSnapshot) {
  const staffAccessStatus: SchoolReadinessStatus =
    snapshot.activeStaffCount === 0 || snapshot.operationalUsersWithoutStaffProfileCount > 0
      ? "blocked"
      : snapshot.unlinkedActiveStaffCount > 0 || snapshot.disabledLinkedStaffCount > 0
        ? "warning"
        : "ready";
  const classSectionStatus: SchoolReadinessStatus =
    snapshot.activeClassSectionCount === 0
      ? "blocked"
      : snapshot.unassignedClassSectionCount > 0
        ? "warning"
        : "ready";

  const checks: SchoolReadinessCheck[] = [
    check(
      "institution",
      "Institution and branding",
      snapshot.activeInstitutionCount > 0 ? "ready" : "blocked",
      snapshot.activeInstitutionCount === 0
        ? "No active institution is available in the current branch scope."
        : snapshot.brandedInstitutionCount === snapshot.activeInstitutionCount
          ? "Institution identity and branding are available."
          : "Institution identity is available. Missing display names or logos use safe fallbacks.",
      "/campus-core/institutions",
      "Review institution"
    ),
    check(
      "branches",
      "Branch access",
      snapshot.activeBranchCount > 0 ? "ready" : "blocked",
      snapshot.activeBranchCount > 0
        ? `${snapshot.activeBranchCount} active branch${snapshot.activeBranchCount === 1 ? "" : "es"} available in your authorized scope.`
        : "No active branch is assigned to this account.",
      "/campus-core/branches",
      "Review branches"
    ),
    check(
      "academic-year",
      "Active academic year",
      snapshot.hasActiveAcademicYear ? "ready" : "blocked",
      snapshot.hasActiveAcademicYear
        ? "An active academic year is available for scoped academic workflows."
        : "Set one active academic year before using attendance and enrollment workflows.",
      "/campus-core/academic-years",
      "Review academic years"
    ),
    check(
      "roles",
      "Canonical school roles",
      snapshot.missingRoleCodes.length === 0 ? "ready" : "blocked",
      snapshot.missingRoleCodes.length === 0
        ? "Principal, Office Staff, Teacher, and Staff roles are active."
        : `Missing active roles: ${snapshot.missingRoleCodes.join(", ")}.`,
      "/campus-core/roles",
      "Review roles"
    ),
    check(
      "principal",
      "School governance account",
      snapshot.activePrincipalCount > 0 ? "ready" : "blocked",
      snapshot.activePrincipalCount > 0
        ? "At least one active Principal has authorized branch access."
        : "No active Principal with branch access was found.",
      "/campus-core/users",
      "Review users"
    ),
    check(
      "staff-access",
      "Staff profiles and login access",
      staffAccessStatus,
      snapshot.activeStaffCount === 0
        ? "Add active staff profiles before running staff or teacher attendance."
        : snapshot.operationalUsersWithoutStaffProfileCount > 0
          ? `${snapshot.operationalUsersWithoutStaffProfileCount} operational user account${snapshot.operationalUsersWithoutStaffProfileCount === 1 ? " is" : "s are"} missing a StaffProfile.`
          : `${snapshot.activeStaffCount} active staff; ${snapshot.unlinkedActiveStaffCount} intentionally have no login access; ${snapshot.disabledLinkedStaffCount} have disabled linked accounts.`,
      "/staffboard/staff",
      "Review staff access"
    ),
    check(
      "password-onboarding",
      "Temporary password onboarding",
      snapshot.mandatoryPasswordChangeCount > 0 ? "warning" : "ready",
      snapshot.mandatoryPasswordChangeCount > 0
        ? `${snapshot.mandatoryPasswordChangeCount} active account${snapshot.mandatoryPasswordChangeCount === 1 ? "" : "s"} must change the temporary password.`
        : "No active scoped account has a pending mandatory password change.",
      "/campus-core/users",
      "Review accounts"
    ),
    check(
      "class-sections",
      "Class sections and teacher assignment",
      classSectionStatus,
      snapshot.activeClassSectionCount === 0
        ? "Add active class sections for the active academic year."
        : snapshot.unassignedClassSectionCount > 0
          ? `${snapshot.unassignedClassSectionCount} active class-section${snapshot.unassignedClassSectionCount === 1 ? " is" : "s are"} missing a class teacher.`
          : "Every active class-section has an assigned class teacher.",
      "/academia/class-sections",
      "Review class sections"
    ),
    check(
      "enrollments",
      "Active student enrollments",
      snapshot.activeEnrollmentCount > 0 ? "ready" : "blocked",
      snapshot.activeEnrollmentCount > 0
        ? `${snapshot.activeEnrollmentCount} active student enrollment${snapshot.activeEnrollmentCount === 1 ? "" : "s"} available.`
        : "No active student enrollment is available for attendance.",
      "/academia/enrollments",
      "Review enrollments"
    ),
    check(
      "attendance-settings",
      "Attendance settings and Staff QR",
      snapshot.activeBranchCount > 0 &&
      snapshot.configuredAttendanceBranchCount === snapshot.activeBranchCount &&
      snapshot.qrEnabledBranchCount === snapshot.activeBranchCount
        ? "ready"
        : "blocked",
      `${snapshot.configuredAttendanceBranchCount} of ${snapshot.activeBranchCount} active branches have attendance settings; Staff QR is enabled for ${snapshot.qrEnabledBranchCount}.`,
      "/campus-core/settings",
      "Review attendance settings"
    ),
    check(
      "passkeys",
      "Passkey deployment configuration",
      snapshot.passkeyConfiguration === "https-ready"
        ? "ready"
        : snapshot.passkeyConfiguration === "local-only"
          ? "warning"
          : "blocked",
      snapshot.passkeyConfiguration === "https-ready"
        ? "WebAuthn is configured for an HTTPS origin."
        : snapshot.passkeyConfiguration === "local-only"
          ? "Passkeys are configured for local development. Set the approved HTTPS origin before deployment."
          : "The WebAuthn origin and relying-party configuration are invalid.",
      "/account/change-password",
      "Review trusted devices"
    )
  ];

  const blockedCount = checks.filter((item) => item.status === "blocked").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const status: SchoolReadinessStatus = blockedCount > 0
    ? "blocked"
    : warningCount > 0 ? "warning" : "ready";

  return { status, blockedCount, warningCount, checks };
}
