"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { NAVBAR_AUTO_HIDE_CONFIG } from "@/config/navbar";

export type NavbarScrollDirection = "up" | "down" | "idle";

export type AutoHideNavbarOptions = {
  enabled?: boolean;
  locked?: boolean;
  topThreshold?: number;
  hideThreshold?: number;
  directionDelta?: number;
};

export type AutoHideNavbarState = {
  isVisible: boolean;
  isNearTop: boolean;
  scrollDirection: NavbarScrollDirection;
};

export type AutoHideNavbarTelemetry = {
  lastScrollY: number;
  directionAnchorY: number;
  candidateDirection: NavbarScrollDirection;
};

export type AutoHideNavbarTransitionInput = {
  currentScrollY: number;
  viewportHeight: number;
  documentHeight: number;
  enabled: boolean;
  locked: boolean;
  topThreshold: number;
  hideThreshold: number;
  directionDelta: number;
};

export const INITIAL_AUTO_HIDE_NAVBAR_STATE: AutoHideNavbarState = {
  isVisible: true,
  isNearTop: true,
  scrollDirection: "idle"
};

export function createAutoHideNavbarTelemetry(scrollY = 0): AutoHideNavbarTelemetry {
  return {
    lastScrollY: Math.max(scrollY, 0),
    directionAnchorY: Math.max(scrollY, 0),
    candidateDirection: "idle"
  };
}

export function getAutoHideNavbarTransition(
  previousState: AutoHideNavbarState,
  previousTelemetry: AutoHideNavbarTelemetry,
  input: AutoHideNavbarTransitionInput
) {
  const currentScrollY = Math.max(input.currentScrollY, 0);
  const isNearTop = currentScrollY < input.topThreshold;
  const pageCanScroll = input.documentHeight > input.viewportHeight + 1;

  if (!input.enabled || input.locked || isNearTop || !pageCanScroll) {
    return {
      state: {
        isVisible: true,
        isNearTop,
        scrollDirection: "idle" as const
      },
      telemetry: createAutoHideNavbarTelemetry(currentScrollY)
    };
  }

  const rawDelta = currentScrollY - previousTelemetry.lastScrollY;
  if (rawDelta === 0) {
    return {
      state: { ...previousState, isNearTop: false },
      telemetry: previousTelemetry
    };
  }

  const candidateDirection: NavbarScrollDirection = rawDelta > 0 ? "down" : "up";
  const directionChanged = candidateDirection !== previousTelemetry.candidateDirection;
  const directionAnchorY = directionChanged
    ? previousTelemetry.lastScrollY
    : previousTelemetry.directionAnchorY;
  const directionalTravel = Math.abs(currentScrollY - directionAnchorY);
  const telemetry = {
    lastScrollY: currentScrollY,
    directionAnchorY,
    candidateDirection
  } satisfies AutoHideNavbarTelemetry;

  if (directionalTravel < input.directionDelta) {
    return {
      state: { ...previousState, isNearTop: false },
      telemetry
    };
  }

  if (candidateDirection === "up") {
    return {
      state: { isVisible: true, isNearTop: false, scrollDirection: "up" as const },
      telemetry
    };
  }

  return {
    state: {
      isVisible: currentScrollY < input.hideThreshold,
      isNearTop: false,
      scrollDirection: "down" as const
    },
    telemetry
  };
}

function statesMatch(left: AutoHideNavbarState, right: AutoHideNavbarState) {
  return (
    left.isVisible === right.isVisible &&
    left.isNearTop === right.isNearTop &&
    left.scrollDirection === right.scrollDirection
  );
}

export function useAutoHideNavbar(options: AutoHideNavbarOptions = {}) {
  const pathname = usePathname();
  const [state, setState] = useState<AutoHideNavbarState>(INITIAL_AUTO_HIDE_NAVBAR_STATE);
  const stateRef = useRef(state);
  const telemetryRef = useRef(createAutoHideNavbarTelemetry());
  const frameRef = useRef<number | null>(null);
  const optionsRef = useRef({
    enabled: options.enabled ?? true,
    locked: options.locked ?? false,
    topThreshold: options.topThreshold ?? NAVBAR_AUTO_HIDE_CONFIG.topThreshold,
    hideThreshold: options.hideThreshold ?? NAVBAR_AUTO_HIDE_CONFIG.hideThreshold,
    directionDelta: options.directionDelta ?? NAVBAR_AUTO_HIDE_CONFIG.directionDelta
  });

  optionsRef.current = {
    enabled: options.enabled ?? true,
    locked: options.locked ?? false,
    topThreshold: options.topThreshold ?? NAVBAR_AUTO_HIDE_CONFIG.topThreshold,
    hideThreshold: options.hideThreshold ?? NAVBAR_AUTO_HIDE_CONFIG.hideThreshold,
    directionDelta: options.directionDelta ?? NAVBAR_AUTO_HIDE_CONFIG.directionDelta
  };
  stateRef.current = state;

  const reveal = useCallback(() => {
    const currentScrollY = typeof window === "undefined" ? 0 : window.scrollY;
    telemetryRef.current = createAutoHideNavbarTelemetry(currentScrollY);
    setState((current) => {
      const next = {
        isVisible: true,
        isNearTop: currentScrollY < optionsRef.current.topThreshold,
        scrollDirection: "idle" as const
      };
      return statesMatch(current, next) ? current : next;
    });
  }, []);

  useEffect(() => {
    if (optionsRef.current.locked || !optionsRef.current.enabled) reveal();
  }, [options.enabled, options.locked, reveal]);

  useEffect(() => {
    reveal();
  }, [pathname, reveal]);

  useEffect(() => {
    const evaluateScroll = () => {
      frameRef.current = null;
      const transition = getAutoHideNavbarTransition(stateRef.current, telemetryRef.current, {
        currentScrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        ...optionsRef.current
      });

      telemetryRef.current = transition.telemetry;
      if (!statesMatch(stateRef.current, transition.state)) {
        stateRef.current = transition.state;
        setState(transition.state);
      }
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(evaluateScroll);
    };

    const onHistoryNavigation = () => reveal();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onHistoryNavigation);
    window.addEventListener("popstate", onHistoryNavigation);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onHistoryNavigation);
      window.removeEventListener("popstate", onHistoryNavigation);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reveal]);

  return { ...state, reveal };
}
