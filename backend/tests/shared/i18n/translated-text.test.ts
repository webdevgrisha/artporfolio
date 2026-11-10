import { describe, expect, it } from "vitest";

import { translatedText } from "#shared/i18n/translated-text";
import type { StoredTranslations } from "#shared/i18n/translations";

function translation(text: string, source = "Слон") {
  return { edited: false, source, text };
}

const translations: StoredTranslations = {
  en: { title: translation("Elephant") },
  pl: { title: translation("Słoń, stary", "Старый слон") },
};

describe("translatedText", () => {
  it("returns the source text in the source language", () => {
    expect(translatedText(translations, "ru", "title", "Слон")).toBe("Слон");
  });

  it("returns the translation, even one made from an older source", () => {
    expect(translatedText(translations, "pl", "title", "Слон")).toBe("Słoń, stary");
  });

  it("returns the English text while the language has no translation", () => {
    expect(translatedText(translations, "de", "title", "Слон")).toBe("Elephant");
  });

  it("returns the source text while there is no translation at all", () => {
    expect(translatedText({}, "de", "title", "Слон")).toBe("Слон");
  });
});
