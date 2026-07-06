import type { ReactNode } from "react";

type MobileStickyActionProps = {
  children: ReactNode;
};

export function MobileStickyAction({ children }: MobileStickyActionProps) {
  return (
    <div
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-3 border-t border-slate-200/70 bg-white/92 px-3 py-3 shadow-[0_-14px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      data-mobile-sticky-action="true"
    >
      {children}
    </div>
  );
}
