import { describe, expect, it } from "vitest";

import { localizedPath } from "@/lib/site/localizedPath";

describe("localizedPath", () => {
  it("puts the home page at the root of its language", () => {
    expect(localizedPath("pl", "/")).toBe("/pl/");
  });

  it("puts another page under its language", () => {
    expect(localizedPath("pl", "/contact")).toBe("/pl/contact");
  });
});
