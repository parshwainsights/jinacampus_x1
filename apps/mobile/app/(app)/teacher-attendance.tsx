import { PageIntro, Screen } from "../../src/components/ui";
import { TeacherAttendanceShell } from "../../src/features/teacher-attendance/teacher-attendance-shell";
import { useAuth } from "../../src/auth/auth-context";

export default function TeacherAttendanceScreen() {
  const auth = useAuth();

  return (
    <Screen>
      <PageIntro
        title="Student Attendance"
        subtitle="Teacher attendance is online-first in v0.1. Offline drafts are deferred."
      />
      <TeacherAttendanceShell sessionToken={auth.token} />
    </Screen>
  );
}
