import { notFound } from "next/navigation";
import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { ClassSectionEditForm } from "@/modules/academia/components/core-record-edit-forms";
import {
  getClassSectionById,
  listClasses,
  listClassTeacherOptions,
  listSections
} from "@/modules/academia/queries";

export default async function EditClassSectionPage({
  params
}: {
  params: Promise<{ classSectionId: string }>;
}) {
  const ctx = await requireAuth();
  const { classSectionId } = await params;
  const classSection = await getClassSectionById(ctx, classSectionId);
  if (!classSection) notFound();

  const permissions = await getEffectivePermissions({
    ctx,
    branchId: classSection.branchId,
    academicYearId: classSection.academicYearId
  });
  if (!permissions.has("academia.class.manage")) return <PermissionState />;

  const [classes, sections, teachers] = await Promise.all([
    listClasses(ctx, { pageSize: 100 }),
    listSections(ctx, { pageSize: 100 }),
    listClassTeacherOptions(ctx, classSection.branchId)
  ]);

  return (
    <ClassSectionEditForm
      record={{
        id: classSection.id,
        classId: classSection.classId,
        sectionId: classSection.sectionId,
        classTeacherUserId: classSection.classTeacherUserId,
        displayName: classSection.displayName,
        capacity: classSection.capacity,
        status: classSection.status,
        branchName: classSection.branch.name,
        academicYearName: classSection.academicYear.name
      }}
      classes={classes.map((item) => ({ id: item.id, name: item.name }))}
      sections={sections.map((item) => ({ id: item.id, name: item.name }))}
      teachers={teachers}
    />
  );
}
