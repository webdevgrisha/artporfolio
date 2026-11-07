import { describe, expect, it } from "vitest";

import type { ResourceTranslations } from "@/shared/api/translations";
import { getLanguageMark, getTranslationHint } from "@/shared/lib/translationsForm";

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

  it("has nothing to say of a language in order, whatever has no Russian text", () => {
    expect(getLanguageMark(data, "en")).toBeNull();
  });

  it("marks what is on the way, what is missing and what fell behind", () => {
    expect(getLanguageMark(data, "pl")).toBe("переводится");
    expect(getLanguageMark(data, "fr")).toBe("переводится");
    expect(getLanguageMark(data, "de")).toBe("устарело");
    expect(getLanguageMark({ ...data, failed: true }, "fr")).toBe("не переведено");
  });
});
