import { describe, expect, it } from "vitest";
import { targetLanguages } from "#shared/i18n/languages";
import {
  planTranslations,
  type StoredTranslations,
  toTranslations,
  translationsBodySchema,
} from "#shared/i18n/translations";

const sources = { title: "Слон" };
const auto = { text: "Elephant", source: "Слон", edited: false };
const edited = { text: "The Elephant", source: "Слон", edited: true };

/** Every language but English, which the tests below set by hand, as already translated. */
function otherLanguages(): StoredTranslations {
  return Object.fromEntries(
    targetLanguages
      .filter((language) => language !== "en")
      .map((language) => [language, { title: auto }]),
  );
}

describe("planTranslations", () => {
  it("asks for every language of a new text", () => {
    const { kept, requests } = planTranslations(sources, {}, {});

    expect(kept).toEqual({});
    expect(requests).toEqual(targetLanguages.map((language) => ({ field: "title", language })));
  });

  it("keeps a translation of the same source without asking for a new one", () => {
    const saved = { ...otherLanguages(), en: { title: auto } };

    expect(planTranslations(sources, saved, {})).toEqual({ kept: saved, requests: [] });
  });

  it("treats the saved text sent back as no edit", () => {
    const saved = { ...otherLanguages(), en: { title: auto } };
    const sent = { en: { title: "Elephant" } };

    expect(planTranslations(sources, saved, sent)).toEqual({ kept: saved, requests: [] });
  });

  it("translates anew when the source changed, keeping the old text in case that fails", () => {
    const saved = { ...otherLanguages(), en: { title: auto } };
    const { kept, requests } = planTranslations({ title: "Тигр" }, saved, {});

    expect(kept.en?.title).toEqual(auto);
    expect(requests).toContainEqual({ field: "title", language: "en" });
  });

  it("saves a changed text as a person's edit made from the current source", () => {
    const saved = { ...otherLanguages(), en: { title: auto } };
    const { kept, requests } = planTranslations(sources, saved, { en: { title: "Big Elephant" } });

    expect(kept.en?.title).toEqual({ text: "Big Elephant", source: "Слон", edited: true });
    expect(requests).toEqual([]);
  });

  it("keeps a person's edit when the source changes", () => {
    const saved = { ...otherLanguages(), en: { title: edited } };
    const { kept, requests } = planTranslations({ title: "Тигр" }, saved, {
      en: { title: "The Elephant" },
    });

    expect(kept.en?.title).toEqual(edited);
    expect(requests).not.toContainEqual({ field: "title", language: "en" });
  });

  it("replaces a person's edit only on request", () => {
    const saved = { ...otherLanguages(), en: { title: edited } };

    expect(planTranslations(sources, saved, { en: { title: null } }).requests).toEqual([
      { field: "title", language: "en" },
    ]);
  });

  it("has no translation of an empty text", () => {
    const saved = { ...otherLanguages(), en: { title: auto } };

    expect(planTranslations({ title: "" }, saved, { en: { title: null } })).toEqual({
      kept: {},
      requests: [],
    });
  });
});

describe("toTranslations", () => {
  it("tells who wrote a translation and leaves out what is not translated", () => {
    const stored = { en: { title: auto }, pl: { title: { ...edited, text: "Słoń" } } };

    expect(toTranslations(stored, { description: "", title: "Слон" })).toEqual({
      en: { title: { status: "auto", text: "Elephant" } },
      pl: { title: { status: "edited", text: "Słoń" } },
    });
  });

  it("shows a translation of an earlier source as out of date, a person's edit too", () => {
    const stored = { en: { title: auto }, pl: { title: edited } };

    expect(toTranslations(stored, { title: "Тигр" })).toEqual({
      en: { title: { status: "outdated", text: "Elephant" } },
      pl: { title: { status: "outdated", text: "The Elephant" } },
    });
  });

  it("leaves out a language no longer in use", () => {
    expect(toTranslations({ ja: { title: auto } }, sources)).toEqual({});
  });
});

describe("translationsBodySchema", () => {
  const schema = translationsBodySchema({ title: 5 });

  it("accepts a text, a request for a new translation and a field left out", () => {
    expect(schema.parse({ de: {}, en: { title: " Elefant " }, pl: { title: null } })).toEqual({
      de: {},
      en: { title: "Elefant" },
      pl: { title: null },
    });
  });

  it("allows a translation longer than its source, up to a limit", () => {
    expect(schema.safeParse({ en: { title: "a".repeat(10) } }).success).toBe(true);
    expect(schema.safeParse({ en: { title: "a".repeat(11) } }).success).toBe(false);
  });

  it("rejects an empty text, an unknown language and an unknown field", () => {
    expect(schema.safeParse({ en: { title: "  " } }).success).toBe(false);
    expect(schema.safeParse({ ja: { title: "象" } }).success).toBe(false);
    expect(schema.safeParse({ en: { city: "Minsk" } }).success).toBe(false);
  });
});
