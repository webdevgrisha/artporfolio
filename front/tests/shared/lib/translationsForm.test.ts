import { describe, expect, it } from "vitest";

import { targetLanguages } from "@/shared/config/languages";
import {
  countOutdated,
  getTranslationHint,
  toTranslationsBody,
  toTranslationValues,
  translationValuesSchema,
} from "@/shared/lib/translationsForm";

describe("toTranslationValues", () => {
  it("gives every language every field, empty until translated", () => {
    const values = toTranslationValues({ en: { title: { status: "auto", text: "Elephant" } } }, [
      "title",
      "city",
    ]);

    expect(Object.keys(values)).toEqual([...targetLanguages]);
    expect(values.en).toEqual({ city: "", title: "Elephant" });
    expect(values.pl).toEqual({ city: "", title: "" });
  });
});

describe("toTranslationsBody", () => {
  it("sends a text as it is and an empty one as a request to translate it", () => {
    const values = toTranslationValues({ en: { title: { status: "auto", text: "Elephant" } } }, [
      "title",
    ]);

    expect(toTranslationsBody(values)).toMatchObject({
      en: { title: "Elephant" },
      pl: { title: null },
    });
  });
});

describe("translationValuesSchema", () => {
  it("trims the texts", () => {
    const values = toTranslationValues({}, ["title"]);
    const parsed = translationValuesSchema({ title: 5 }).parse({
      ...values,
      en: { title: " Elephant " },
    });

    expect(parsed.en.title).toBe("Elephant");
  });
});

describe("getTranslationHint", () => {
  it("tells who wrote the text and gives the Russian one", () => {
    expect(getTranslationHint({ original: "Слон", status: "auto", text: "Elephant" })).toBe(
      "Автоперевод. Оригинал: Слон",
    );
    expect(getTranslationHint({ original: "Слон", status: "edited", text: "Elephant" })).toBe(
      "Исправлено вручную. Оригинал: Слон",
    );
  });

  it("warns of a translation of an earlier Russian text", () => {
    expect(getTranslationHint({ original: "Тигр", status: "outdated", text: "Elephant" })).toBe(
      "Устарел: русский текст изменился. Оригинал: Тигр",
    );
  });

  it("says that an emptied field is translated on save", () => {
    expect(getTranslationHint({ original: "Слон", status: "edited", text: "" })).toBe(
      "Переведётся при сохранении. Оригинал: Слон",
    );
  });

  it("calls a text typed into an untranslated field a person's", () => {
    expect(getTranslationHint({ original: "Слон", status: undefined, text: "Elephant" })).toBe(
      "Написано вручную. Оригинал: Слон",
    );
  });

  it("needs no translation of an empty Russian text", () => {
    expect(getTranslationHint({ original: "", status: undefined, text: "" })).toBe(
      "На русском текста нет, поэтому и перевод не нужен",
    );
  });
});

describe("countOutdated", () => {
  it("counts the out of date texts of one language", () => {
    const translations = {
      en: {
        city: { status: "auto", text: "Minsk" },
        title: { status: "outdated", text: "Elephant" },
      },
      pl: { title: { status: "outdated", text: "Słoń" } },
    } as const;

    expect(countOutdated(translations, "en")).toBe(1);
    expect(countOutdated(translations, "de")).toBe(0);
  });
});
