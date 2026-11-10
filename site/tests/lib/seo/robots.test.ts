import { describe, expect, it } from "vitest";

import { buildRobots } from "@/lib/seo/robots";

describe("buildRobots", () => {
  const robots = buildRobots("https://example.com");

  it("keeps crawlers out of the API only", () => {
    expect(robots).toContain("Disallow: /api/");
    expect(robots).not.toContain("/admin");
  });

  it("points to the sitemap", () => {
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});
