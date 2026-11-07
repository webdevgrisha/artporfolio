import { describe, expect, it } from "vitest";

import type { ResourceTranslations } from "@/entities/translation";
import {
  getLanguageMark,
  getLanguageSummary,
  getTranslationHint,
} from "@/features/edit-translations/lib/translationsForm";

const hint = (params: Partial<Parameters<typeof getTranslationHint>[0]>) =>
  getTranslationHint({
    failed: false,
    status: "auto",
    text: "Elephant",
    ...params,
  });

describe("getTranslationHint", () => {
  it("tells who wrote the text and gives the Russian one", () => {
    expect(hint({})).toBe("Автоперевод");
    expect(hint({ status: "edited" })).toBe("Исправлено вручную");
  });

  it("warns of a person's text of an earlier Russian text", () => {
    expect(hint({ status: "outdated" })).toBe("Устарел: русский текст изменился");
  });

  it("tells that the translator is at work", () => {
    expect(hint({ status: "pending" })).toBe("Переводится…");
    expect(hint({ status: undefined, text: "" })).toBe("Переводится…");
  });

  it("calls a text typed into an untranslated field a person's", () => {
    expect(hint({ status: undefined })).toBe("Написано вручную");
  });

  it("tells that the translator gave up", () => {
    expect(hint({ failed: true, status: undefined, text: "" })).toBe("Не удалось перевести");
  });
});

describe("getLanguageMark", () => {
  const data: ResourceTranslations = {
    failed: false,
    isTranslating: true,
    sources: { city: "", title: "Слон" },
    translations: {
      de: { title: { status: "outdated", text: "Elefant" } },
      en: { title: { status: "auto", text: "Elephant" } },
      pl: { title: { status: "pending", text: "Słoń" } },
    },
  };

  const keys = ["city", "title"];

  it("has nothing to say of a language in order, whatever has no Russian text", () => {
    expect(getLanguageMark(data, "en", keys)).toBeNull();
  });

  it("leaves out the texts the form does not show", () => {
    expect(getLanguageMark(data, "fr", ["city"])).toBeNull();
    expect(getLanguageSummary(data, "fr", ["city"])).toBeNull();
  });

  it("counts what needs attention beside the chosen language", () => {
    expect(getLanguageSummary(data, "en", keys)).toBeNull();
    expect(getLanguageSummary(data, "pl", keys)).toBe("Переводится: 1");
    expect(getLanguageSummary(data, "de", keys)).toBe("Устарело: 1");
    expect(getLanguageSummary({ ...data, failed: true }, "fr", keys)).toBe("Не переведено: 1");
  });

  it("marks what is on the way, what is missing and what fell behind", () => {
    expect(getLanguageMark(data, "pl", keys)).toBe("переводится");
    expect(getLanguageMark(data, "fr", keys)).toBe("переводится");
    expect(getLanguageMark(data, "de", keys)).toBe("устарело");
    expect(getLanguageMark({ ...data, failed: true }, "fr", keys)).toBe("не переведено");
  });
});
