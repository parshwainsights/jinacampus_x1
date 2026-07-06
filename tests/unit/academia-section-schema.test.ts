import { describe, expect, it } from "vitest";
import { createSectionSchema, updateSectionSchema } from "@/modules/academia/schemas";

describe("academia section schemas", () => {
  it("accepts single-letter section codes used by the demo seed and UI", () => {
    expect(createSectionSchema.parse({
      code: "A",
      name: "A",
      sortOrder: 1,
      status: "ACTIVE"
    })).toMatchObject({
      code: "A",
      name: "A"
    });

    expect(updateSectionSchema.parse({
      sectionId: "00000000-0000-0000-0000-000000000001",
      code: "B",
      name: "B"
    })).toMatchObject({
      code: "B",
      name: "B"
    });
  });
});
