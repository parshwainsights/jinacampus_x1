import Link from "next/link";
import type { ReactNode } from "react";
import type { TenantContext } from "@/lib/tenant/context";

const administratorNavItems = [
  { href: "/administrator", label: "Dashboard" },
  { href: "/administrator/schools", label: "Schools" },
  { href: "/administrator/schools/create", label: "Create School" }
];

export function AdministratorShell({
  ctx,
  children,
  activeHref
}: {
  ctx: TenantContext;
  children: ReactNode;
  activeHref?: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.12),transparent_30%),linear-gradient(135deg,#f8fafc,#eef6ff)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <p className="premium-muted-chip">JinaCampus Administrator Portal</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">School and tenant governance</h1>
            <p className="mt-1 truncate text-sm text-slate-500">
              Signed in as {ctx.userEmail}
            </p>
          </div>
          <form action="/api/auth/administrator-logout" method="post">
            <button className="premium-secondary-button w-full premium-focus sm:w-auto">Logout</button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="premium-card h-max p-3">
          <nav aria-label="Administrator navigation" className="grid gap-2">
            {administratorNavItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition premium-focus",
                    isActive
                      ? "border border-brand-100 bg-brand-50 text-brand-700 shadow-sm"
                      : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-2 text-xs leading-5 text-slate-500">
              Open a selected school dashboard from the Schools registry. Administrator view does not impersonate school users.
            </div>
          </nav>
        </aside>
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
