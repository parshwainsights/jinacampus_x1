import { EmptyState } from "@/components/ui/empty-state";

type DashboardEmptyStateProps = {
  title: string;
  description: string;
};

export function DashboardEmptyState({ title, description }: DashboardEmptyStateProps) {
  return <EmptyState title={title} description={description} />;
}
