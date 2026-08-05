import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("staff leave review navigation", () => {
  it("shows leave settings only with the settings permission", async () => {
    const source = await readFile(
      path.join(process.cwd(), "src/app/(dashboard)/staffboard/leave/review/page.tsx"),
      "utf8"
    );

    expect(source).toContain('permissions.has("staffboard.leave.settings.manage")');
    expect(source).toContain('href="/staffboard/leave/settings"');
  });
});
