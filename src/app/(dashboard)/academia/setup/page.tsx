import { PermissionState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import {
  CreateClassSectionSetupForm,
  CreateClassSetupForm,
  CreateSectionSetupForm,
  CreateSubjectSetupForm
} from "@/modules/academia/components/academic-setup-forms";
import {
  listClasses,
  listClassSections,
  listClassTeacherOptions,
  listSections,
  listSubjects
} from "@/modules/academia/queries";

export default async function AcademicSetupPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  const setupPermissions = [
    "academia.class.manage",
    "academia.section.manage",
    "academia.subject.manage"
  ] as const;
  const canManageSetup = setupPermissions.every((permission) => permissions.has(permission));
  if (!canManageSetup) return <PermissionState />;

  const [classes, sections, subjects, classSections, teachers] = await Promise.all([
    listClasses(ctx, { pageSize: 100 }),
    listSections(ctx, { pageSize: 100 }),
    listSubjects(ctx, { pageSize: 100 }),
    listClassSections(ctx, { pageSize: 100 }),
    listClassTeacherOptions(ctx)
  ]);

  const counts = [
    { label: "Classes", value: classes.length },
    { label: "Sections", value: sections.length },
    { label: "Class Sections", value: classSections.length },
    { label: "Subjects", value: subjects.length }
  ];

  return (
    <div className="space-y-6">
      <header className="premium-glass-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Academia</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Academic Setup</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Complete the school setup in sequence: create class levels, reusable sections, map class sections for the active branch and year, then maintain the subject master.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {counts.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="premium-card p-5">
        <CreateClassSetupForm />
        <CreateSectionSetupForm />
        <CreateClassSectionSetupForm
          classes={classes.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          sections={sections.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          teachers={teachers}
          activeBranchName={ctx.activeBranchName}
          activeAcademicYearName={ctx.activeAcademicYearName}
        />
        <CreateSubjectSetupForm />
      </div>
    </div>
  );
}
