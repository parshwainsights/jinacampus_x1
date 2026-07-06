"use client";

import { StudentRegistrationForm } from "@/modules/academia/components/student-registration-form";

type BranchOption = {
  id: string;
  name: string;
};

export function StudentCreateForm({
  branchOptions,
  defaultBranchId
}: {
  branchOptions: BranchOption[];
  defaultBranchId?: string;
}) {
  return (
    <StudentRegistrationForm
      mode="create"
      branchOptions={branchOptions}
      defaultBranchId={defaultBranchId}
    />
  );
}
