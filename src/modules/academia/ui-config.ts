import type { PermissionCode } from "@/lib/rbac/permissions";

export type AcademiaModuleKey =
  | "overview"
  | "classes"
  | "sections"
  | "class-sections"
  | "subjects"
  | "students"
  | "guardians"
  | "enrollments"
  | "attendance";

export type AcademiaModuleCard = {
  key: AcademiaModuleKey;
  title: string;
  description: string;
  href: string | null;
  permissions: readonly PermissionCode[];
  status?: "coming-soon";
};

export type AcademiaListPageConfig = {
  title: string;
  description: string;
  actionLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  columns: readonly string[];
};

export const academiaAttendanceRoutes = {
  overview: "/academia/attendance",
  mark: "/academia/attendance/mark",
  reports: "/academia/attendance/reports"
} as const;

export const academiaModuleCards: readonly AcademiaModuleCard[] = [
  {
    key: "classes",
    title: "Classes",
    description: "Create the academic class levels used across branches.",
    href: "/academia/classes",
    permissions: ["academia.class.manage"]
  },
  {
    key: "sections",
    title: "Sections",
    description: "Maintain reusable section labels for class-section mapping.",
    href: "/academia/sections",
    permissions: ["academia.section.manage"]
  },
  {
    key: "class-sections",
    title: "Class Sections",
    description: "Map classes and sections for a branch and academic year.",
    href: "/academia/class-sections",
    permissions: ["academia.class.manage"]
  },
  {
    key: "subjects",
    title: "Subjects",
    description: "Manage academic and co-curricular subject records.",
    href: "/academia/subjects",
    permissions: ["academia.subject.manage"]
  },
  {
    key: "students",
    title: "Students",
    description: "Review student profiles and academic record readiness.",
    href: "/academia/students",
    permissions: ["academia.student.view"]
  },
  {
    key: "guardians",
    title: "Guardians",
    description: "Review parent and guardian contact profiles.",
    href: "/academia/guardians",
    permissions: ["academia.guardian.manage"]
  },
  {
    key: "enrollments",
    title: "Enrollments",
    description: "Review active academic-year class-section placements.",
    href: "/academia/enrollments",
    permissions: ["academia.enrollment.manage"]
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Mark daily full-day class-section attendance and review locked-state readiness.",
    href: academiaAttendanceRoutes.overview,
    permissions: ["academia.attendance.view", "academia.attendance.mark", "academia.attendance.report"]
  }
] as const;

export function getVisibleAcademiaModuleCards(permissions: ReadonlySet<PermissionCode>) {
  return academiaModuleCards.filter((card) => card.permissions.some((permission) => permissions.has(permission)));
}

export const academiaListPageConfigs = {
  classes: {
    title: "Classes",
    description: "Manage academic class levels such as Nursery, Class 1, Class 2, and so on.",
    actionLabel: "Add Class",
    searchPlaceholder: "Search classes by name or code",
    emptyTitle: "No classes yet",
    emptyDescription: "Add class levels such as Class 1 or Class 2 so sections, enrollments, and attendance can be organized.",
    columns: ["Name", "Code", "Status", "Sort Order", "Updated At", "Actions"]
  },
  sections: {
    title: "Sections",
    description: "Manage reusable section labels such as A, B, C, Red, Blue, or Morning.",
    actionLabel: "Add Section",
    searchPlaceholder: "Search sections by name or code",
    emptyTitle: "No sections yet",
    emptyDescription: "Create reusable section labels before setting up class-section mappings.",
    columns: ["Name", "Code", "Status", "Sort Order", "Updated At", "Actions"]
  },
  classSections: {
    title: "Class Sections",
    description: "Map classes and sections for a branch and academic year.",
    actionLabel: "Create Class Section",
    searchPlaceholder: "Search class sections",
    emptyTitle: "No class sections found",
    emptyDescription: "Create classes and sections before setting up class sections for a branch and academic year.",
    columns: ["Class", "Section", "Branch", "Academic Year", "Class Teacher", "Capacity", "Status", "Actions"]
  },
  subjects: {
    title: "Subjects",
    description: "Manage academic and co-curricular subjects.",
    actionLabel: "Add Subject",
    searchPlaceholder: "Search subjects by name or code",
    emptyTitle: "No subjects yet",
    emptyDescription: "Add academic and co-curricular subjects so the school timetable and reports have clear subject records.",
    columns: ["Name", "Code", "Type", "Status", "Updated At", "Actions"]
  },
  students: {
    title: "Students",
    description: "Manage student profiles and academic records.",
    actionLabel: "Add Student",
    searchPlaceholder: "Search students by name or admission number",
    emptyTitle: "No students found",
    emptyDescription: "Add your first student profile to start managing enrollments and attendance.",
    columns: ["Scholar / Admission No.", "Student Name", "Current Class Section", "Father / Guardian", "Category", "Status", "Actions"]
  },
  guardians: {
    title: "Guardians",
    description: "Manage parent and guardian contact profiles.",
    actionLabel: "Add Guardian",
    searchPlaceholder: "Search guardians by name, phone, or email",
    emptyTitle: "No guardians found",
    emptyDescription: "Guardian profiles appear after they are linked to student records.",
    columns: ["Guardian Name", "Phone", "Email", "Linked Students", "Status", "Actions"]
  },
  enrollments: {
    title: "Enrollments",
    description: "Manage student class-section enrollment for the active academic year.",
    actionLabel: "Create Enrollment",
    searchPlaceholder: "Search enrollments by student or roll number",
    emptyTitle: "No enrollments found",
    emptyDescription: "Enroll students into active class sections before marking attendance.",
    columns: ["Student", "Class Section", "Roll Number", "Enrollment Date", "Status", "Actions"]
  }
} as const satisfies Record<string, AcademiaListPageConfig>;
