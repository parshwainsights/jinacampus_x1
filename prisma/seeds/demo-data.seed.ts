export const DEMO_TENANT = {
  name: "JinaCampus Demo School",
  slug: "jinacampus-demo",
  legalName: "JinaCampus Demo School Educational Trust"
} as const;

export const DEMO_INSTITUTION = {
  name: "JinaCampus Demo Institution",
  displayName: "JinaCampus Demo School",
  code: "MAIN",
  city: "Ahmedabad",
  state: "Gujarat"
} as const;

export const DEMO_BRANCH = {
  name: "Main Branch",
  code: "MAIN",
  city: "Ahmedabad",
  state: "Gujarat"
} as const;

export const DEMO_ACADEMIC_YEAR = {
  name: "2026-27",
  startDate: "2026-04-01",
  endDate: "2027-03-31"
} as const;

const DEFAULT_DEMO_USER_PASSWORD = "JinaCampus@123";

export const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD ?? DEFAULT_DEMO_USER_PASSWORD;
export const DEMO_STAFF_PASSWORD = process.env.DEMO_STAFF_PASSWORD ?? DEMO_USER_PASSWORD;

export const DEMO_USERS = [
  {
    key: "admin",
    email: "admin@demo.jinacampus.test",
    firstName: "Aarav",
    lastName: "Admin",
    displayName: "Aarav Admin",
    roleCodes: ["ADMIN"]
  },
  {
    key: "principal",
    email: "principal@demo.jinacampus.test",
    firstName: "Meera",
    lastName: "Principal",
    displayName: "Meera Principal",
    roleCodes: ["PRINCIPAL"]
  },
  {
    key: "teacher",
    email: "teacher@demo.jinacampus.test",
    firstName: "Anaya",
    lastName: "Teacher",
    displayName: "Anaya Teacher",
    roleCodes: ["CLASS_TEACHER"]
  },
  {
    key: "staff",
    email: "staff@demo.jinacampus.test",
    firstName: "Rohan",
    lastName: "Staff",
    displayName: "Rohan Staff",
    roleCodes: ["STAFF"]
  },
  {
    key: "office",
    email: "office@demo.jinacampus.test",
    firstName: "Kavya",
    lastName: "Office",
    displayName: "Kavya Office",
    roleCodes: ["OFFICE_STAFF"]
  }
] as const;

export type DemoUserSeedKey = (typeof DEMO_USERS)[number]["key"];

export function getDemoUserPassword(userKey: DemoUserSeedKey) {
  return userKey === "staff" ? DEMO_STAFF_PASSWORD : DEMO_USER_PASSWORD;
}

export const DEMO_CLASSES = [
  { code: "CLASS-1", name: "Class 1", sortOrder: 1 },
  { code: "CLASS-2", name: "Class 2", sortOrder: 2 },
  { code: "CLASS-3", name: "Class 3", sortOrder: 3 }
] as const;

export const DEMO_SECTIONS = [
  { code: "A", name: "A", sortOrder: 1 },
  { code: "B", name: "B", sortOrder: 2 }
] as const;

export const DEMO_CLASS_SECTIONS = [
  { key: "class-1-a", classCode: "CLASS-1", sectionCode: "A", displayName: "Class 1-A", classTeacherUserKey: "teacher", capacity: 40 },
  { key: "class-2-a", classCode: "CLASS-2", sectionCode: "A", displayName: "Class 2-A", capacity: 40 },
  { key: "class-3-a", classCode: "CLASS-3", sectionCode: "A", displayName: "Class 3-A", capacity: 40 }
] as const;

export const DEMO_SUBJECTS = [
  { code: "ENG", name: "English", type: "CORE" },
  { code: "HIN", name: "Hindi", type: "CORE" },
  { code: "MATH", name: "Mathematics", type: "CORE" },
  { code: "EVS", name: "Environmental Studies", type: "CORE" },
  { code: "COMP", name: "Computer", type: "CORE" }
] as const;

export const DEMO_STUDENTS = [
  { admissionNumber: "JD-2026-001", firstName: "Aditi", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-1-a", rollNumber: "1", guardianFirstName: "Riya", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-002", firstName: "Vivaan", lastName: "Demo", gender: "MALE", classSectionKey: "class-1-a", rollNumber: "2", guardianFirstName: "Nikhil", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-003", firstName: "Sara", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-1-a", rollNumber: "3", guardianFirstName: "Pooja", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-004", firstName: "Arjun", lastName: "Demo", gender: "MALE", classSectionKey: "class-1-a", rollNumber: "4", guardianFirstName: "Dev", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-005", firstName: "Ira", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-1-a", rollNumber: "5", guardianFirstName: "Neha", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-006", firstName: "Kabir", lastName: "Demo", gender: "MALE", classSectionKey: "class-1-a", rollNumber: "6", guardianFirstName: "Milan", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-007", firstName: "Anvi", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-2-a", rollNumber: "1", guardianFirstName: "Tara", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-008", firstName: "Reyansh", lastName: "Demo", gender: "MALE", classSectionKey: "class-2-a", rollNumber: "2", guardianFirstName: "Harsh", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-009", firstName: "Myra", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-2-a", rollNumber: "3", guardianFirstName: "Kinjal", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-010", firstName: "Dhruv", lastName: "Demo", gender: "MALE", classSectionKey: "class-2-a", rollNumber: "4", guardianFirstName: "Naman", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-011", firstName: "Siya", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-2-a", rollNumber: "5", guardianFirstName: "Shreya", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-012", firstName: "Aryan", lastName: "Demo", gender: "MALE", classSectionKey: "class-2-a", rollNumber: "6", guardianFirstName: "Rakesh", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-013", firstName: "Tanya", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-3-a", rollNumber: "1", guardianFirstName: "Hetal", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-014", firstName: "Vihaan", lastName: "Demo", gender: "MALE", classSectionKey: "class-3-a", rollNumber: "2", guardianFirstName: "Kunal", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-015", firstName: "Nisha", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-3-a", rollNumber: "3", guardianFirstName: "Amrita", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-016", firstName: "Om", lastName: "Demo", gender: "MALE", classSectionKey: "class-3-a", rollNumber: "4", guardianFirstName: "Rohit", guardianLastName: "Demo", guardianRelation: "FATHER" },
  { admissionNumber: "JD-2026-017", firstName: "Pari", lastName: "Demo", gender: "FEMALE", classSectionKey: "class-3-a", rollNumber: "5", guardianFirstName: "Sneha", guardianLastName: "Demo", guardianRelation: "MOTHER" },
  { admissionNumber: "JD-2026-018", firstName: "Yash", lastName: "Demo", gender: "MALE", classSectionKey: "class-3-a", rollNumber: "6", guardianFirstName: "Bhavesh", guardianLastName: "Demo", guardianRelation: "FATHER" }
] as const;

export const DEMO_STAFF_PROFILES = [
  { employeeCode: "JD-ADM-001", firstName: "Aarav", lastName: "Admin", staffType: "ADMIN", designation: "School Admin", department: "Administration", userKey: "admin" },
  { employeeCode: "JD-PRI-001", firstName: "Meera", lastName: "Principal", staffType: "MANAGEMENT", designation: "Principal", department: "Leadership", userKey: "principal" },
  { employeeCode: "JD-TCH-001", firstName: "Anaya", lastName: "Teacher", staffType: "TEACHER", designation: "Class Teacher", department: "Primary", userKey: "teacher" },
  { employeeCode: "JD-TCH-002", firstName: "Devika", lastName: "Teacher", staffType: "TEACHER", designation: "English Teacher", department: "Primary" },
  { employeeCode: "JD-TCH-003", firstName: "Manav", lastName: "Teacher", staffType: "TEACHER", designation: "Math Teacher", department: "Primary" },
  { employeeCode: "JD-TCH-004", firstName: "Ritu", lastName: "Teacher", staffType: "TEACHER", designation: "EVS Teacher", department: "Primary" },
  { employeeCode: "JD-OFF-001", firstName: "Kavya", lastName: "Office", staffType: "ADMIN", designation: "Office Executive", department: "Administration", userKey: "office" },
  { employeeCode: "JD-ACC-001", firstName: "Mihir", lastName: "Accounts", staffType: "ACCOUNTANT", designation: "Accountant", department: "Accounts" },
  { employeeCode: "JD-STF-001", firstName: "Rohan", lastName: "Staff", staffType: "SECURITY", designation: "Security Guard", department: "Security", userKey: "staff" },
  { employeeCode: "JD-HLP-001", firstName: "Nita", lastName: "Helper", staffType: "HELPER", designation: "Class Helper", department: "Operations" },
  { employeeCode: "JD-DRV-001", firstName: "Suresh", lastName: "Driver", staffType: "DRIVER", designation: "Driver", department: "Transport" }
] as const;

export const DEMO_TODAY_STUDENT_ATTENDANCE = [
  { classSectionKey: "class-1-a", statuses: ["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE", "HALF_DAY"] },
  { classSectionKey: "class-2-a", statuses: ["PRESENT", "ABSENT", "LATE"] }
] as const;

export const DEMO_STAFF_ATTENDANCE_TODAY = [
  { employeeCode: "JD-ADM-001", status: "PRESENT", checkIn: "07:45", checkOut: "15:45", workingMinutes: 480, source: "MANUAL_ADMIN" },
  { employeeCode: "JD-PRI-001", status: "PRESENT", checkIn: "07:50", checkOut: "16:10", workingMinutes: 500, source: "MANUAL_ADMIN" },
  { employeeCode: "JD-TCH-002", status: "LATE", checkIn: "08:18", checkOut: "15:45", workingMinutes: 447, source: "QR_SCAN" },
  { employeeCode: "JD-TCH-003", status: "PRESENT", checkIn: "07:52", checkOut: "15:40", workingMinutes: 468, source: "QR_SCAN" },
  { employeeCode: "JD-TCH-004", status: "ABSENT", source: "MANUAL_ADMIN" },
  { employeeCode: "JD-OFF-001", status: "HALF_DAY", checkIn: "08:05", checkOut: "11:30", workingMinutes: 205, source: "MANUAL_ADMIN", correctionReason: "Demo correction after office verification." },
  { employeeCode: "JD-ACC-001", status: "ON_LEAVE", source: "MANUAL_ADMIN" },
  { employeeCode: "JD-HLP-001", status: "PRESENT", checkIn: "07:40", checkOut: "15:20", workingMinutes: 460, source: "QR_SCAN" }
] as const;
