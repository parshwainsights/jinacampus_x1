export type MobileRoleCode = "ADMIN" | "PRINCIPAL" | "CLASS_TEACHER" | "TEACHER" | "STAFF" | string;

export type StudentAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE" | "EXCUSED";

export type MobileInstitution = {
  displayName?: string | null;
  name?: string | null;
  logoUrl?: string | null;
};

export type MobileBranch = {
  name?: string | null;
  code?: string | null;
};

export type MobileAcademicYear = {
  name?: string | null;
};

export type MobileCapabilityFlags = {
  canScanStaffQr: boolean;
  canViewMyAttendance: boolean;
  canMarkStudentAttendance: boolean;
};

export type MobileUser = {
  name: string;
  email: string;
  roles: Array<{ code: MobileRoleCode; label: string }>;
  capabilities: MobileCapabilityFlags;
  institution?: MobileInstitution | null;
  branch?: MobileBranch | null;
  academicYear?: MobileAcademicYear | null;
};

export type MobileLoginRequest = {
  schoolId: string;
  email: string;
  password: string;
};

export type MobileLoginResponse = {
  success: true;
  token: string;
  user: MobileUser;
  institution?: MobileInstitution | null;
  branch?: MobileBranch | null;
  academicYear?: MobileAcademicYear | null;
};

export type MobileMeResponse = {
  success: true;
  user: MobileUser;
  institution?: MobileInstitution | null;
  branch?: MobileBranch | null;
  academicYear?: MobileAcademicYear | null;
};

export type StaffQrScanResponse = {
  success: true;
  message: string;
  purpose: "CHECK_IN" | "CHECK_OUT";
  attendanceDate: string;
  status: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workingMinutes?: number | null;
};

export type StaffAttendanceStatus = {
  attendanceDate: string;
  status: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workingMinutes?: number | null;
};

export type StaffAttendanceStatusResponse = {
  success: true;
  attendance: StaffAttendanceStatus | null;
  message?: string;
};

export type TeacherClassSection = {
  id: string;
  className?: string;
  sectionName?: string;
  displayName: string;
};

export type TeacherStudent = {
  studentId: string;
  admissionNo: string;
  name: string;
  rollNumber?: string | null;
};

export type TeacherClassSectionsResponse = {
  success: true;
  classSections: TeacherClassSection[];
};

export type TeacherClassSectionStudentsResponse = {
  success: true;
  students: TeacherStudent[];
};

export type SubmitStudentAttendanceResponse = {
  success: true;
  message: string;
  summary: {
    total: number;
    activeStudents: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    onLeave: number;
    excused: number;
    created: number;
    updated: number;
  };
};

export type SubmitStudentAttendanceInput = {
  classSectionId: string;
  attendanceDate: string;
  entries: Array<{
    studentId: string;
    status: StudentAttendanceStatus;
    remarks?: string;
  }>;
};
