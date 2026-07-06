import { describe, expect, it } from "vitest";
import { dashboardDateFilterSchema, dashboardSummaryFilterSchema } from "@/modules/dashboard/schemas";

const branchId = "00000000-0000-0000-0000-000000000003";

describe("dashboard filter schemas", () => {
  it("accepts optional date and branch filters", () => {
    const result = dashboardSummaryFilterSchema.safeParse({
      date: "2026-05-07",
      branchId
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toEqual(new Date(Date.UTC(2026, 4, 7)));
      expect(result.data.branchId).toBe(branchId);
    }
  });

  it("rejects invalid dashboard dates", () => {
    expect(dashboardDateFilterSchema.safeParse({ date: "2026-02-31" }).success).toBe(false);
  });

  it("rejects invalid branch IDs", () => {
    expect(dashboardSummaryFilterSchema.safeParse({ branchId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects sensitive client context fields", () => {
    const result = dashboardSummaryFilterSchema.safeParse({
      date: "2026-05-07",
      tenantId: "00000000-0000-0000-0000-000000000001",
      actorUserId: "00000000-0000-0000-0000-000000000002"
    });

    expect(result.success).toBe(false);
  });
});
