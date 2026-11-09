import { describe, expect, it } from "vitest";

import { languages } from "@/lib/i18n/languages";
import { alternateLinks } from "@/lib/seo/alternateLinks";

const siteUrl = "https://example.com";

describe("alternateLinks", () => {
  it("names the page in every language by the tag of its variant", () => {
    const links = alternateLinks("/contact", siteUrl);

    expect(links).toHaveLength(languages.length + 1);
    expect(links).toContainEqual({ href: "https://example.com/pt/contact", hreflang: "pt-BR" });
    expect(links).toContainEqual({ href: "https://example.com/zh/contact", hreflang: "zh-Hans" });
  });

  it("sends a visitor of another language to English", () => {
    expect(alternateLinks("/", siteUrl)).toContainEqual({
      href: "https://example.com/en/",
      hreflang: "x-default",
    });
  });
});
