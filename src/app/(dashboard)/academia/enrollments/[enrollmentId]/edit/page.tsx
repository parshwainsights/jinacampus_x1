import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { getEnrollmentById } from "@/modules/academia/queries";
import { EnrollmentEditForm } from "@/modules/academia/components/core-record-edit-forms";

function dateInputValue(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function studentName(student: { admissionNumber: string; displayName: string | null; firstName: string; lastName: string | null }) {
  return student.displayName ?? [student.firstName, student.lastName].filter(Boolean).join(" ") ?? student.admissionNumber;
}

export default async function EditEnrollmentPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const ctx = await requireAuth();
  const { enrollmentId } = await params;
  const permissions = await getEffectivePermissions({
    ctx,
    branchId: ctx.activeBranchId,
    academicYearId: ctx.activeAcademicYearId
  });
  if (!permissions.has("academia.enrollment.manage")) return <PermissionState />;

  const enrollment = await getEnrollmentById(ctx, enrollmentId);
  if (!enrollment) notFound();

  return (
    <EnrollmentEditForm
      enrollment={{
        id: enrollment.id,
        studentName: studentName(enrollment.student),
        admissionNumber: enrollment.student.admissionNumber,
        branchName: enrollment.branch.name,
        academicYearName: enrollment.academicYear.name,
        classSectionName: enrollment.classSection.displayName,
        rollNumber: enrollment.rollNumber,
        status: enrollment.status,
        enrolledOn: dateInputValue(enrollment.enrolledOn),
        leftOn: dateInputValue(enrollment.leftOn)
      }}
    />
  );
}
