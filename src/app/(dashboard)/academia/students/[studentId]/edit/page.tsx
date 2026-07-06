import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listAccessibleBranches } from "@/modules/campus-core/queries";
import { getStudentById } from "@/modules/academia/queries";
import { StudentEditForm } from "@/modules/academia/components/core-record-edit-forms";

function dateInputValue(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const ctx = await requireAuth();
  const { studentId } = await params;
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("academia.student.update")) return <PermissionState />;

  const [student, branches] = await Promise.all([getStudentById(ctx, studentId), listAccessibleBranches(ctx)]);
  if (!student) notFound();

  return (
    <StudentEditForm
      branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))}
      student={{
        id: student.id,
        branchId: student.branchId,
        admissionNumber: student.admissionNumber,
        admissionDate: dateInputValue(student.admissionDate),
        fullName: student.fullName,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        displayName: student.displayName,
        dateOfBirth: dateInputValue(student.dateOfBirth),
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        fatherName: student.fatherName,
        fatherOccupation: student.fatherOccupation,
        motherName: student.motherName,
        guardianName: student.guardianName,
        aadhaarMasked: student.aadhaarMasked,
        familyIdNumber: student.familyIdNumber,
        sssmIdNumber: student.sssmIdNumber,
        apaarIdNumber: student.apaarIdNumber,
        religion: student.religion,
        caste: student.caste,
        category: student.category,
        nationality: student.nationality,
        currentAddress: student.currentAddress,
        permanentAddress: student.permanentAddress,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        bankAccountMasked: student.bankAccountMasked,
        bankBranchName: student.bankBranchName,
        ifscCode: student.ifscCode,
        status: student.status,
        joinedAt: dateInputValue(student.joinedAt),
        leftAt: dateInputValue(student.leftAt)
      }}
    />
  );
}
