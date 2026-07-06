import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  ApiError,
  getTeacherClassSections,
  getTeacherClassSectionStudents,
  submitStudentAttendance
} from "../../api/client";
import type { StudentAttendanceStatus } from "../../api/contracts";
import { Card, DetailRow, Message, PrimaryButton, SecondaryButton, StatusBadge } from "../../components/ui";
import { colors, radius, spacing } from "../../lib/theme";

const attendanceStatuses: Array<{ value: StudentAttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half day" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "EXCUSED", label: "Excused" }
];

type AttendanceEntryDraft = {
  studentId: string;
  status: StudentAttendanceStatus;
  remarks: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function teacherApiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MOBILE_API_PENDING") {
      return "Teacher attendance APIs are pending or unavailable for this backend.";
    }
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    return error.message;
  }
  return "Unable to complete this attendance request. Please try again.";
}

function isDateInputValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function TeacherAttendanceShell({ sessionToken }: { sessionToken: string | null }) {
  const queryClient = useQueryClient();
  const [selectedClassSectionId, setSelectedClassSectionId] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayDate());
  const [entries, setEntries] = useState<AttendanceEntryDraft[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const classSectionsQuery = useQuery({
    queryKey: ["teacher-class-sections"],
    queryFn: () => getTeacherClassSections(sessionToken ?? ""),
    enabled: Boolean(sessionToken),
    retry: false
  });
  const classSections = classSectionsQuery.data?.classSections ?? [];
  const selectedClassSection = classSections.find((section) => section.id === selectedClassSectionId) ?? null;

  useEffect(() => {
    if (!selectedClassSectionId && classSections.length > 0) {
      setSelectedClassSectionId(classSections[0].id);
    }
  }, [classSections, selectedClassSectionId]);

  const studentsQuery = useQuery({
    queryKey: ["teacher-class-section-students", selectedClassSectionId],
    queryFn: () => getTeacherClassSectionStudents(sessionToken ?? "", selectedClassSectionId ?? ""),
    enabled: Boolean(sessionToken && selectedClassSectionId),
    retry: false
  });
  const students = studentsQuery.data?.students ?? [];

  useEffect(() => {
    if (!studentsQuery.data) return;
    setEntries(studentsQuery.data.students.map((student) => ({
      studentId: student.studentId,
      status: "PRESENT",
      remarks: ""
    })));
    setSuccessMessage(null);
    setLocalError(null);
  }, [studentsQuery.data]);

  const entryByStudentId = useMemo(() => {
    return new Map(entries.map((entry) => [entry.studentId, entry]));
  }, [entries]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!sessionToken) throw new ApiError("Please sign in again before submitting attendance.", "MOBILE_SESSION_MISSING", 401);
      if (!selectedClassSectionId) throw new ApiError("Select a class-section before submitting attendance.", "CLASS_SECTION_REQUIRED", 400);
      if (!isDateInputValid(attendanceDate)) throw new ApiError("Enter attendance date in YYYY-MM-DD format.", "ATTENDANCE_DATE_INVALID", 400);
      if (entries.length === 0) throw new ApiError("No students are loaded for attendance submission.", "STUDENT_ENTRIES_REQUIRED", 400);
      return submitStudentAttendance(sessionToken, {
        classSectionId: selectedClassSectionId,
        attendanceDate,
        entries: entries.map((entry) => ({
          studentId: entry.studentId,
          status: entry.status,
          remarks: entry.remarks.trim() || undefined
        }))
      });
    },
    onSuccess: (response) => {
      setSuccessMessage(response.message);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["teacher-class-section-students", selectedClassSectionId] });
    },
    onError: (error) => {
      setSuccessMessage(null);
      setLocalError(teacherApiMessage(error));
    }
  });

  function markAllPresent() {
    setEntries((current) => current.map((entry) => ({ ...entry, status: "PRESENT" })));
    setSuccessMessage(null);
  }

  function updateEntryStatus(studentId: string, status: StudentAttendanceStatus) {
    setEntries((current) => current.map((entry) => (
      entry.studentId === studentId ? { ...entry, status } : entry
    )));
    setSuccessMessage(null);
  }

  function updateEntryRemarks(studentId: string, remarks: string) {
    setEntries((current) => current.map((entry) => (
      entry.studentId === studentId ? { ...entry, remarks } : entry
    )));
    setSuccessMessage(null);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Card elevated>
        <StatusBadge label="Teacher workflow" tone="info" />
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
          Class Sections
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Select an assigned class-section to load active enrolled students from the mobile backend API.
        </Text>
        <PrimaryButton
          label="Refresh Class Sections"
          onPress={() => void classSectionsQuery.refetch()}
          loading={classSectionsQuery.isFetching}
        />
      </Card>

      {classSectionsQuery.error ? <Message tone="info">{teacherApiMessage(classSectionsQuery.error)}</Message> : null}

      {classSections.length > 0 ? (
        <Card>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
            Assigned Class-Sections
          </Text>
          {classSections.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => {
                setSelectedClassSectionId(section.id);
                setSuccessMessage(null);
                setLocalError(null);
              }}
              style={{
                minHeight: 48,
                justifyContent: "center",
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selectedClassSectionId === section.id ? colors.primary : colors.border,
                backgroundColor: selectedClassSectionId === section.id ? colors.primarySoft : colors.surfaceGlass,
                padding: spacing.md
              }}
            >
              <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                {section.displayName}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : classSectionsQuery.isFetched && !classSectionsQuery.error ? (
        <Message tone="info">No class-sections are available for attendance marking.</Message>
      ) : (
        <Message tone="info">Loading assigned class-sections...</Message>
      )}

      {selectedClassSection ? (
        <Card>
          <DetailRow label="Selected class-section" value={selectedClassSection.displayName} />
          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Attendance date</Text>
            <TextInput
              value={attendanceDate}
              onChangeText={(value) => {
                setAttendanceDate(value);
                setSuccessMessage(null);
              }}
              accessibilityLabel="Attendance date"
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              style={{
                minHeight: 48,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceGlass,
                color: colors.text,
                fontSize: 16,
                paddingHorizontal: spacing.md
              }}
              placeholderTextColor={colors.muted}
            />
          </View>
          <SecondaryButton label="Mark All Present" onPress={markAllPresent} />
        </Card>
      ) : null}

      {studentsQuery.isFetching ? <Message tone="info">Loading active enrolled students...</Message> : null}
      {studentsQuery.error ? <Message tone="error">{teacherApiMessage(studentsQuery.error)}</Message> : null}
      {localError ? <Message tone="error">{localError}</Message> : null}
      {successMessage ? <Message tone="success">{successMessage}</Message> : null}

      {students.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          {students.map((student) => {
            const entry = entryByStudentId.get(student.studentId);
            return (
              <Card key={student.studentId}>
                <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
                  {student.name}
                </Text>
                <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  Admission: {student.admissionNo}
                  {student.rollNumber ? ` - Roll: ${student.rollNumber}` : ""}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                  {attendanceStatuses.map((status) => {
                    const selected = entry?.status === status.value;
                    return (
                      <Pressable
                        key={status.value}
                        onPress={() => updateEntryStatus(student.studentId, status.value)}
                        style={{
                          minHeight: 40,
                          justifyContent: "center",
                          borderRadius: radius.pill,
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary : colors.surfaceGlass,
                          paddingHorizontal: spacing.md
                        }}
                      >
                        <Text style={{ color: selected ? "#ffffff" : colors.text, fontSize: 13, fontWeight: "700" }}>
                          {status.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={entry?.remarks ?? ""}
                  onChangeText={(value) => updateEntryRemarks(student.studentId, value)}
                  accessibilityLabel={`Remarks for ${student.name}`}
                  placeholder="Remarks, if needed"
                  placeholderTextColor={colors.muted}
                  style={{
                    minHeight: 44,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceGlass,
                    color: colors.text,
                    paddingHorizontal: spacing.md
                  }}
                />
              </Card>
            );
          })}
          <PrimaryButton
            label="Submit Attendance"
            onPress={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={!selectedClassSectionId || entries.length === 0}
          />
        </View>
      ) : selectedClassSectionId && studentsQuery.isFetched && !studentsQuery.error ? (
        <Message tone="info">No active enrolled students were found for this class-section.</Message>
      ) : null}

      <Card>
        <StatusBadge label="Deferred offline support" tone="warning" />
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
          Online-first v0.1
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Offline drafts are planned for a future phase. QR attendance and student attendance both require the backend connection in v0.1.
        </Text>
      </Card>
    </View>
  );
}
