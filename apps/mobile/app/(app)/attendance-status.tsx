import { useQuery } from "@tanstack/react-query";
import { ApiError, getMyStaffAttendanceStatus } from "../../src/api/client";
import { useAuth } from "../../src/auth/auth-context";
import { Card, DetailRow, Message, PageIntro, PrimaryButton, Screen, StatusBadge } from "../../src/components/ui";

function statusMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MOBILE_API_PENDING") return "My Attendance API is pending. The native shell is ready.";
    return error.message;
  }
  return "Unable to load attendance status. Please try again.";
}

export default function AttendanceStatusScreen() {
  const auth = useAuth();
  const statusQuery = useQuery({
    queryKey: ["my-staff-attendance-status"],
    queryFn: () => getMyStaffAttendanceStatus(auth.token ?? ""),
    enabled: Boolean(auth.token),
    retry: false
  });
  const attendance = statusQuery.data?.attendance ?? null;

  return (
    <Screen>
      <PageIntro title="My Attendance" subtitle="Today's staff attendance status from the mobile backend API." />
      {statusQuery.isFetching ? <Message tone="info">Loading today&apos;s attendance status...</Message> : null}
      {statusQuery.error ? <Message tone="info">{statusMessage(statusQuery.error)}</Message> : null}
      {statusQuery.data?.message ? <Message tone="info">{statusQuery.data.message}</Message> : null}
      {statusQuery.isFetched && !statusQuery.error && !attendance && !statusQuery.data?.message ? (
        <Message tone="info">No attendance recorded yet today.</Message>
      ) : null}
      {attendance ? (
        <Card elevated>
          <StatusBadge label={attendance.status} tone={attendance.status === "ABSENT" ? "error" : attendance.status === "LATE" || attendance.status === "HALF_DAY" ? "warning" : "success"} />
          <DetailRow label="Date" value={attendance.attendanceDate} />
          <DetailRow label="Status" value={attendance.status} />
          <DetailRow label="Check-in" value={attendance.checkInAt ?? "Not recorded"} />
          <DetailRow label="Check-out" value={attendance.checkOutAt ?? "Not recorded"} />
          <DetailRow label="Working minutes" value={attendance.workingMinutes ?? "Not available"} />
        </Card>
      ) : null}
      <PrimaryButton
        label="Refresh Status"
        onPress={() => void statusQuery.refetch()}
        loading={statusQuery.isFetching}
      />
    </Screen>
  );
}
