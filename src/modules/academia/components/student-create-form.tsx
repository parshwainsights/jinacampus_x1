"use client";

import {
  StudentRegistrationForm,
  type RegistrationClassSectionOption
} from "@/modules/academia/components/student-registration-form";

type BranchOption = {
  id: string;
  name: string;
};

export function StudentCreateForm({
  branchOptions,
  classSectionOptions,
  defaultBranchId
}: {
  branchOptions: BranchOption[];
  classSectionOptions: RegistrationClassSectionOption[];
  defaultBranchId?: string;
}) {
  return (
    <StudentRegistrationForm
      mode="create"
      branchOptions={branchOptions}
      classSectionOptions={classSectionOptions}
      defaultBranchId={defaultBranchId}
    />
  );
}
