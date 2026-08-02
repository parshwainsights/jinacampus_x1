"use client";

import { NAVBAR_AUTO_HIDE_CONFIG } from "@/config/navbar";

export function TopEdgeRevealZone({ onReveal }: { onReveal: () => void }) {
  return (
    <div
      className="navbar-reveal-zone fixed inset-x-0 top-0 z-[60]"
      data-navbar-reveal-zone="true"
      aria-hidden="true"
      style={{ height: NAVBAR_AUTO_HIDE_CONFIG.revealZoneHeight }}
      onPointerEnter={onReveal}
    />
  );
}
