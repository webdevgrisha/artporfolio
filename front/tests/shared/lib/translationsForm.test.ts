import { describe, expect, it } from "vitest";

import { targetLanguages } from "@/shared/config/languages";
import {
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
