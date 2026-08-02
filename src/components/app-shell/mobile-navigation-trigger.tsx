"use client";

import { forwardRef } from "react";
import { Menu } from "lucide-react";

type MobileNavigationTriggerProps = {
  isOpen: boolean;
  onClick: () => void;
};

export const MobileNavigationTrigger = forwardRef<HTMLButtonElement, MobileNavigationTriggerProps>(
  function MobileNavigationTrigger({ isOpen, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-campus-border bg-white text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 premium-focus lg:hidden"
        aria-label={isOpen ? "Close application navigation" : "Open application navigation"}
        aria-expanded={isOpen}
        aria-controls="mobile-application-navigation"
        onClick={onClick}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }
);
