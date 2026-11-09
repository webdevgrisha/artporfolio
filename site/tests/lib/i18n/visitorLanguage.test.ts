import { describe, expect, it } from "vitest";

import { visitorLanguage } from "@/lib/i18n/visitorLanguage";

describe("visitorLanguage", () => {
  it("keeps the language the visitor chose over what their browser asks for", () => {
    expect(visitorLanguage({ acceptLanguage: "de", chosen: "pl" })).toBe("pl");
  });

  it("takes the language of the browser when the visitor chose none", () => {
    expect(visitorLanguage({ acceptLanguage: "de-DE,de;q=0.9", chosen: undefined })).toBe("de");
  });

  it("ignores a cookie that names no language of the site", () => {
    expect(visitorLanguage({ acceptLanguage: "it", chosen: "xx" })).toBe("it");
  });

  it("opens the site in English when nothing fits", () => {
    expect(visitorLanguage({ acceptLanguage: "fi", chosen: undefined })).toBe("en");
    expect(visitorLanguage({ acceptLanguage: null, chosen: undefined })).toBe("en");
  });
});
