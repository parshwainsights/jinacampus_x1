import Link from "next/link";
import type { ReactNode } from "react";

type StateTone = "neutral" | "danger" | "warning" | "success";

type BaseStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
  tone?: StateTone;
};

type StateShellProps = BaseStateProps & {
  role?: "alert" | "status";
  ariaLive?: "polite" | "assertive";
  loading?: boolean;
};

const toneClassNames: Record<StateTone, string> = {
  neutral: "border-slate-200/80 bg-white/[0.86] text-slate-800",
  danger: "border-rose-200 bg-rose-50/90 text-rose-900",
  warning: "border-amber-200 bg-amber-50/90 text-amber-900",
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-900"
};

const descriptionClassNames: Record<StateTone, string> = {
  neutral: "text-slate-500",
  danger: "text-rose-800",
  warning: "text-amber-800",
  success: "text-emerald-800"
};

function StateShell({
  title,
  description,
  actionLabel,
  actionHref,
  children,
  tone = "neutral",
  role,
  ariaLive,
  loading = false
}: StateShellProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`motion-fade-in relative min-w-0 overflow-hidden rounded-2xl border px-4 py-8 text-center shadow-soft backdrop-blur sm:px-6 ${toneClassNames[tone]}`}
    >
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent" />
      {loading ? (
        <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-slate-200 border-t-brand-600 motion-safe:animate-spin" aria-hidden="true" />
      ) : null}
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? (
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-6 ${descriptionClassNames[tone]}`}>
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link href={actionHref} className="premium-primary-button min-h-11 w-full sm:w-auto premium-focus">
            {actionLabel}
          </Link>
        </div>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function EmptyState(props: BaseStateProps) {
  return <StateShell {...props} />;
}

export function NoResultsState({
  title = "No results found",
  description = "Try changing the selected filters or search term.",
  ...props
}: Partial<BaseStateProps>) {
  return <StateShell title={title} description={description} {...props} />;
}

export function LoadingState({
  title = "Loading...",
  description = "Please wait while we prepare this page.",
  ...props
}: Partial<BaseStateProps>) {
  return <StateShell title={title} description={description} role="status" ariaLive="polite" loading {...props} />;
}

export function ErrorState({
  title = "We could not load this page",
  description = "Please try again or contact your school administrator.",
  ...props
}: Partial<BaseStateProps>) {
  return <StateShell title={title} description={description} role="alert" ariaLive="assertive" tone="danger" {...props} />;
}

export function PermissionState({
  title = "You do not have permission to view this page",
  description = "Please contact your school administrator if you need access.",
  ...props
}: Partial<BaseStateProps>) {
  return <StateShell title={title} description={description} role="alert" ariaLive="polite" tone="warning" {...props} />;
}

export function PrerequisiteState({
  title = "Setup is needed first",
  description = "Complete the required setup before continuing.",
  ...props
}: Partial<BaseStateProps>) {
  return <StateShell title={title} description={description} tone="warning" {...props} />;
}
