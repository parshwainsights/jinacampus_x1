export function AttendanceLockedAlert() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Attendance is locked for this class-section and date.</p>
      <p className="mt-1 leading-6">
        Normal teacher submission is disabled. Admin or principal correction with a reason is required for any change.
      </p>
    </div>
  );
}
