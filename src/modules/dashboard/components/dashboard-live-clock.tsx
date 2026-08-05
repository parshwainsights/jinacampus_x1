"use client";

import { useEffect, useState } from "react";
import { safeTimeZone } from "@/lib/dates/time-zone";

export function DashboardLiveClock({ timeZone, compact = false }: { timeZone?: string | null; compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const resolvedTimeZone = safeTimeZone(timeZone);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now
    ? new Intl.DateTimeFormat("en-IN", {
      timeZone: resolvedTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now)
    : "--:--:--";

  return (
    <div className={compact ? "rounded-lg border border-slate-200 bg-white/75 px-3 py-2" : "motion-soft-hover min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm"}>
      <p className="text-xs font-semibold uppercase text-slate-500">School time</p>
      <p className="mt-1 tabular-nums text-sm font-semibold text-slate-900" aria-live="off">{time}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{resolvedTimeZone}</p>
    </div>
  );
}
