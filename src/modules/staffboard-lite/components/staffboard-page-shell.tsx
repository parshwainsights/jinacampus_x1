import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, NoResultsState } from "@/components/ui/empty-state";
import {
  ResponsiveTable,
  StatusBadge,
  TableActionLink,
  formatEnumLabel
} from "@/components/ui/table-primitives";
import type { StaffboardListPageConfig } from "@/modules/staffboard-lite/ui-config";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

type SearchToolbarProps = {
  title: string;
  placeholder: string;
  defaultValue?: string;
};

type TableShellProps = {
  columns: readonly string[];
  children: ReactNode;
};

type ListPageShellProps = {
  config: StaffboardListPageConfig;
  search?: string;
  rowCount: number;
  children: ReactNode;
};

export type RouteSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function resolveSearchParam(searchParams?: RouteSearchParams) {
  const params = searchParams ? await searchParams : {};
  const search = params.search;
  return typeof search === "string" && search.trim().length > 0 ? search.trim() : undefined;
}

export function PageHeader({ title, description, actionLabel }: PageHeaderProps) {
  return (
    <div className="premium-glass-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actionLabel ? (
        <button
          type="button"
          disabled
          className="premium-primary-button w-full opacity-70 sm:w-auto premium-focus"
          title="This create workflow is not available on this page yet."
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SearchToolbar({ title, placeholder, defaultValue }: SearchToolbarProps) {
  const searchId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-search`;

  return (
    <form method="get" role="search" aria-label={`Search ${title}`} className="premium-card p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={searchId} className="text-sm font-semibold text-slate-700">
            Search {title}
          </label>
          <input
            id={searchId}
            name="search"
            type="search"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="mt-2 min-h-11 w-full min-w-0"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="submit" className="premium-primary-button">
            Search
          </button>
          <Link href="?" className="premium-secondary-button premium-focus">
            Clear search
          </Link>
        </div>
      </div>
    </form>
  );
}

export function TableShell({ columns, children }: TableShellProps) {
  return <ResponsiveTable columns={columns} minWidthClass="min-w-[980px]" caption={`${columns.join(", ")} table`}>{children}</ResponsiveTable>;
}

export function ListPageShell({ config, search, rowCount, children }: ListPageShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} actionLabel={config.actionLabel} />
      <SearchToolbar title={config.title} placeholder={config.searchPlaceholder} defaultValue={search} />
      {rowCount > 0 ? (
        <TableShell columns={config.columns}>{children}</TableShell>
      ) : search ? (
        <NoResultsState
          title={`No ${config.title.toLowerCase()} match your search`}
          description="Try a different search term or clear the search to see all available records."
        />
      ) : (
        <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
      )}
    </div>
  );
}

export function StatusPill({ value }: { value?: string | null }) {
  return <StatusBadge value={value} />;
}

export function ReadOnlyAction() {
  return (
    <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
      Read-only
    </span>
  );
}

export function ComingSoonPill() {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Coming soon
    </span>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="premium-card block p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] premium-focus">
      {children}
    </Link>
  );
}

export function StaticCard({ children }: { children: ReactNode }) {
  return (
    <div className="premium-card p-5">
      {children}
    </div>
  );
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export { TableActionLink, formatEnumLabel };
