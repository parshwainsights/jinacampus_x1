export const STUDENT_IMPORT_COLUMNS = [
  { key: "admissionNumber", label: "Admission Number", required: true },
  { key: "admissionDate", label: "Admission Date (YYYY-MM-DD)", required: true },
  { key: "fullName", label: "Full Name", required: true },
  { key: "displayName", label: "Display Name", required: false },
  { key: "dateOfBirth", label: "Date of Birth (YYYY-MM-DD)", required: true },
  { key: "gender", label: "Gender", required: false },
  { key: "bloodGroup", label: "Blood Group", required: false },
  { key: "fatherName", label: "Father Name", required: true },
  { key: "fatherOccupation", label: "Father Occupation", required: false },
  { key: "motherName", label: "Mother Name", required: true },
  { key: "guardianName", label: "Other Guardian Name", required: false },
  { key: "guardianRelation", label: "Primary Guardian Relation", required: true },
  { key: "guardianPhone", label: "Guardian Mobile", required: false },
  { key: "guardianEmail", label: "Guardian Email", required: false },
  { key: "aadhaarNumber", label: "Aadhaar Number", required: true },
  { key: "familyIdNumber", label: "Family ID", required: false },
  { key: "sssmIdNumber", label: "SSSM ID", required: false },
  { key: "apaarIdNumber", label: "APAAR ID", required: false },
  { key: "religion", label: "Religion", required: true },
  { key: "caste", label: "Caste", required: true },
  { key: "category", label: "Category", required: true },
  { key: "nationality", label: "Nationality", required: true },
  { key: "currentAddress", label: "Current Address", required: false },
  { key: "permanentAddress", label: "Permanent Address", required: false },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State / UT", required: true },
  { key: "pincode", label: "Pincode", required: false },
  { key: "bankAccountNumber", label: "Bank Account Number", required: false },
  { key: "bankBranchName", label: "Bank Branch", required: false },
  { key: "ifscCode", label: "IFSC", required: false },
  { key: "classSection", label: "Class Section", required: false },
  { key: "rollNumber", label: "Roll Number", required: false },
  { key: "enrollmentDate", label: "Enrollment Date (YYYY-MM-DD)", required: false }
] as const;

export type StudentImportColumnKey = (typeof STUDENT_IMPORT_COLUMNS)[number]["key"];

export const REQUIRED_STUDENT_IMPORT_COLUMNS = STUDENT_IMPORT_COLUMNS
  .filter((column) => column.required)
  .map((column) => column.key);

export const MAX_STUDENT_IMPORT_ROWS = 5_000;
export const MAX_STUDENT_IMPORT_FILE_BYTES = 4_000_000;
