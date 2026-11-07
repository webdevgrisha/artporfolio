import { describe, expect, it } from "vitest";

import { targetLanguages } from "#shared/i18n/languages";
import {
  planTranslations,
  type StoredTranslations,
  textsById,
  toTranslations,
} from "#shared/i18n/translations";

const sources = { title: "Слон" };
const auto = { text: "Elephant", source: "Слон", edited: false };
const edited = { text: "The Elephant", source: "Слон", edited: true };

function everyLanguage(translation: typeof auto): StoredTranslations {
  return Object.fromEntries(targetLanguages.map((language) => [language, { title: translation }]));
}

describe("planTranslations", () => {
  it("asks for every language of a new text", () => {
    const { kept, requests } = planTranslations(sources, {});

    expect(kept).toEqual({});
    expect(requests).toEqual(targetLanguages.map((language) => ({ key: "title", language })));
  });

  it("keeps a translation of the same source without asking for a new one", () => {
    const saved = everyLanguage(auto);

    expect(planTranslations(sources, saved)).toEqual({ kept: saved, requests: [] });
  });

  it("asks anew when the source changed, keeping the old text meanwhile", () => {
    const { kept, requests } = planTranslations({ title: "Тигр" }, everyLanguage(auto));

    expect(kept.en?.title).toEqual(auto);
    expect(requests).toContainEqual({ key: "title", language: "en" });
  });

  it("keeps a person's edit when the source changes", () => {
    const { kept, requests } = planTranslations({ title: "Тигр" }, everyLanguage(edited));

    expect(kept.en?.title).toEqual(edited);
    expect(requests).toEqual([]);
  });

  it("has no translation of an empty text", () => {
    expect(planTranslations({ title: "" }, everyLanguage(auto))).toEqual({
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

  it("tells a text about to be replaced from a person's text of an earlier source", () => {
    const stored = { en: { title: auto }, pl: { title: edited } };

    expect(toTranslations(stored, { title: "Тигр" })).toEqual({
      en: { title: { status: "pending", text: "Elephant" } },
      pl: { title: { status: "outdated", text: "The Elephant" } },
    });
  });

  it("leaves out a language no longer in use", () => {
    expect(toTranslations({ xx: { title: auto } }, sources)).toEqual({});
  });
});

describe("textsById", () => {
  it("gives each text under the id of its item", () => {
    expect(textsById([{ id: "a", title: "Масло" }], ({ title }) => title)).toEqual({ a: "Масло" });
  });
});
