import { InstitutionLogo } from "@/components/brand/institution-logo";

import type { AppShellBranding } from "./branding";

type InstitutionBrandProps = {
  branding: AppShellBranding;
  compact?: boolean;
  className?: string;
};

export function InstitutionBrand({ branding, compact = false, className = "" }: InstitutionBrandProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`} data-institution-brand="true">
      <InstitutionLogo
        name={branding.institutionName}
        logoUrl={branding.logoUrl}
        className={compact ? "h-8 w-8" : "h-11 w-11"}
      />
      <div className="min-w-0">
        {compact ? null : <p className="text-[11px] font-medium text-slate-500">Institution</p>}
        <p
          className={compact
            ? "truncate text-xs font-bold text-brand-800"
            : "truncate text-sm font-bold text-ink"}
          title={branding.institutionName}
        >
          {branding.institutionName}
        </p>
      </div>
    </div>
  );
}
