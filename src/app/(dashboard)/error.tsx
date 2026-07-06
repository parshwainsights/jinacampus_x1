"use client";

import { ErrorState } from "@/components/ui/empty-state";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState
        title="We could not load this page"
        description="Please try again or contact your school administrator if the problem continues."
      >
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100 sm:w-auto"
        >
          Try again
        </button>
      </ErrorState>
    </div>
  );
}
