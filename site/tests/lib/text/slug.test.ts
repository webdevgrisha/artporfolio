import { describe, expect, it } from "vitest";

import { slug } from "@/lib/text/slug";

describe("slug", () => {
  it("joins the words with hyphens, in lowercase", () => {
    expect(slug("Dragonfly & Co.")).toBe("dragonfly-co");
    expect(slug("  The Tiger, 2025  ")).toBe("the-tiger-2025");
  });

  it("keeps Latin letters without their accents", () => {
    expect(slug("Éléphant à Kraków")).toBe("elephant-a-krakow");
  });

  it("is empty for a text without Latin letters or digits", () => {
    expect(slug("Слон")).toBe("");
    expect(slug("蜻蜓")).toBe("");
  });
});
