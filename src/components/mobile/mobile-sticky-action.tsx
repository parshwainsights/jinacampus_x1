import type { ReactNode } from "react";

type MobileStickyActionProps = {
  children: ReactNode;
};

export function MobileStickyAction({ children }: MobileStickyActionProps) {
  return (
    <div
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-3 border-t border-campus-border bg-white px-3 py-3 shadow-[0_-10px_24px_rgba(11,22,56,0.08)] lg:hidden"
      data-mobile-sticky-action="true"
    >
      {children}
    </div>
  );
}
