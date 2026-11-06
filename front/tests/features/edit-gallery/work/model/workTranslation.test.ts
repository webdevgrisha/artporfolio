import { describe, expect, it } from "vitest";

import { getTranslationHint } from "@/features/edit-gallery/work/model/workTranslation";

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
