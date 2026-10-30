import { describe, expect, it } from "vitest";

import { adminHomePath, toAdminPath } from "@/shared/config/routes";

describe("toAdminPath", () => {
  it("keeps a page of the admin", () => {
    expect(toAdminPath("/admin/about/text?tab=1")).toBe("/admin/about/text?tab=1");
  });

  it.each([
    ["another site", "https://example.com/admin/"],
    ["a protocol-relative URL", "//example.com"],
    ["a page outside the admin", "/"],
    ["no value", null],
    ["a file", new File([], "admin")],
  ])("goes to the admin home instead of %s", (_name, value) => {
    expect(toAdminPath(value)).toBe(adminHomePath);
  });
});
