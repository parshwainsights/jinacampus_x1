"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type NavbarPopoverProps = {
  accessibleLabel: string;
  trigger: (isOpen: boolean) => ReactNode;
  children: ReactNode;
  buttonClassName: string;
  panelClassName: string;
  panelRole?: "dialog" | "menu";
  onOpenChange?: (isOpen: boolean) => void;
  dataAttribute?: string;
};

export function NavbarPopover({
  accessibleLabel,
  trigger,
  children,
  buttonClassName,
  panelClassName,
  panelRole = "dialog",
  onOpenChange,
  dataAttribute
}: NavbarPopoverProps) {
  const pathname = usePathname();
  const generatedId = useId();
  const panelId = `navbar-popover-${generatedId.replace(/:/g, "")}`;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const updateOpen = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);
    onOpenChangeRef.current?.(nextOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) updateOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      updateOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, updateOpen]);

  useEffect(() => {
    updateOpen(false);
  }, [pathname, updateOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0" data-navbar-popover={dataAttribute} data-open={isOpen}>
      <button
        ref={triggerRef}
        type="button"
        className={buttonClassName}
        aria-label={accessibleLabel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup={panelRole === "menu" ? "menu" : "dialog"}
        onClick={() => updateOpen(!isOpen)}
      >
        {trigger(isOpen)}
      </button>
      {isOpen ? (
        <div
          id={panelId}
          role={panelRole}
          aria-label={accessibleLabel}
          className={panelClassName}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a")) updateOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
