import { describe, expect, it } from "vitest";

import { languageOfPath } from "@/lib/i18n/languageOfPath";

describe("languageOfPath", () => {
  it("reads the language from the first segment", () => {
    expect(languageOfPath("/pl/contact")).toBe("pl");
    expect(languageOfPath("/uk/")).toBe("uk");
  });

  it("takes English for a path outside the languages", () => {
    expect(languageOfPath("/missing")).toBe("en");
    expect(languageOfPath("/")).toBe("en");
  });
});
