import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DashboardStatusMix,
  DashboardTrendChart
} from "@/modules/dashboard/components/dashboard-visualizations";
import type { DashboardAttendanceTrendPoint } from "@/modules/dashboard/queries";

function trendPoint(day: number, presenceRate: number | null): DashboardAttendanceTrendPoint {
  const date = `2026-05-${String(day).padStart(2, "0")}`;
  return {
    date,
    label: `${String(day).padStart(2, "0")} May`,
    recorded: presenceRate === null ? 0 : 10,
    present: presenceRate === null ? 0 : Math.round(presenceRate / 10),
    absent: presenceRate === null ? 0 : 10 - Math.round(presenceRate / 10),
    late: 0,
    halfDay: 0,
    presenceRate
  };
}

describe("dashboard visualizations", () => {
  it("renders a nonblank accessible trend chart and source table", () => {
    const studentTrend = [70, 80, null, 90, 80, 90, 100].map((rate, index) => trendPoint(index + 1, rate));
    const staffTrend = [60, 70, 70, 80, 80, 90, 90].map((rate, index) => trendPoint(index + 1, rate));
    const markup = renderToStaticMarkup(createElement(DashboardTrendChart, {
      idPrefix: "test-attendance",
      studentTrend,
      staffTrend
    }));

    expect(markup).toContain("<svg");
    expect(markup).toMatch(/<path d="M[\d.,L ]+"/);
    expect(markup).toContain("Seven-day attendance trend values");
    expect(markup).toContain("Students 100%");
    expect(markup).toContain("Staff 90%");
    expect(markup).toContain("Missing records are not treated as absence");
  });

  it("renders a safe empty visualization when no attendance is recorded", () => {
    const emptyTrend = Array.from({ length: 7 }, (_, index) => trendPoint(index + 1, null));
    const markup = renderToStaticMarkup(createElement(DashboardTrendChart, {
      idPrefix: "test-empty-attendance",
      studentTrend: emptyTrend,
      staffTrend: null,
      compact: true
    }));

    expect(markup).toContain("No attendance trend yet");
    expect(markup).not.toContain("<path");
  });

  it("renders recorded status meters and class marking completion", () => {
    const markup = renderToStaticMarkup(createElement(DashboardStatusMix, {
      studentAttendance: {
        date: "2026-05-07",
        marked: 10,
        present: 7,
        absent: 1,
        late: 1,
        halfDay: 1,
        eligibleClassSections: 4,
        classesMarked: 3,
        classesNotMarked: 1,
        markingRate: 75
      },
      staffAttendance: {
        date: "2026-05-07",
        checkedIn: 8,
        present: 6,
        late: 1,
        halfDay: 1,
        absent: 1,
        notMarked: 1,
        notMarkedOrAbsent: 2
      },
      staffBoard: {
        totalActiveStaff: 10,
        totalTeachers: 6,
        totalNonTeachingStaff: 4,
        activeStaffByType: {}
      }
    }));

    expect(markup).toContain("Class marking completion");
    expect(markup).toContain("3/4 (75%)");
    expect(markup).toContain("aria-label=\"Not marked: 1 of 10\"");
    expect(markup).not.toMatch(/tokenHash|passwordHash|rawToken/i);
  });
});
