import { describe, expect, it } from "vitest";

import { languages } from "@/lib/i18n/languages";
import { buildSitemap } from "@/lib/seo/sitemap";

describe("buildSitemap", () => {
  const sitemap = buildSitemap(["/", "/contact"], "https://example.com");

  it("lists every page in every language", () => {
    expect(sitemap.match(/<loc>/g)).toHaveLength(2 * languages.length);
    expect(sitemap).toContain("<loc>https://example.com/uk/contact</loc>");
  });

  it("names the other languages of each page", () => {
    expect(sitemap).toContain(
      '<xhtml:link rel="alternate" hreflang="ar" href="https://example.com/ar/"/>',
    );
  });
});
