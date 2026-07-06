import { EmptyState, PrerequisiteState } from "@/components/ui/empty-state";

export function AttendanceEmptyState({
  title = "No active students loaded",
  description = "Select a class-section and date, then load active enrolled students.",
  kind = "empty"
}: {
  title?: string;
  description?: string;
  kind?: "empty" | "prerequisite";
}) {
  if (kind === "prerequisite") {
    return <PrerequisiteState title={title} description={description} />;
  }

  return <EmptyState title={title} description={description} />;
}
