import { describe, expect, it } from "vitest";
import { isLanguage, languages } from "@/lib/i18n/languages";
import { languageTag } from "@/lib/i18n/languageTag";
import { textDirection } from "@/lib/i18n/textDirection";
import { sourceLanguage, targetLanguages } from "../../../../backend/src/shared/i18n/languages";

describe("languages", () => {
  it("are the languages the backend translates the texts into", () => {
    expect([...languages].sort()).toEqual([sourceLanguage, ...targetLanguages].sort());
  });

  it("tells a language of the site from any other value", () => {
    expect(isLanguage("pl")).toBe(true);
    expect(isLanguage("xx")).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });

  it("names the variant the texts are in for lang and hreflang", () => {
    expect(languageTag("pt")).toBe("pt-BR");
    expect(languageTag("zh")).toBe("zh-Hans");
    expect(languageTag("de")).toBe("de");
  });

  it("writes Arabic from right to left and the rest from left to right", () => {
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("en")).toBe("ltr");
  });
});
