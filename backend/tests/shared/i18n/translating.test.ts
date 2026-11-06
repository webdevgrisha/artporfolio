import { beforeEach, describe, expect, it, vi } from "vitest";

const deepl = vi.hoisted(() => ({ translateTexts: vi.fn() }));
const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("#shared/i18n/deepl", () => deepl);
vi.mock("firebase-functions/logger", () => logger);

import { targetLanguages } from "#shared/i18n/languages";
import { saveTranslations } from "#shared/i18n/translating";

const sources = { city: "Минск", title: "Слон" };

beforeEach(() => {
  vi.clearAllMocks();
  deepl.translateTexts.mockImplementation(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  );
});

describe("saveTranslations", () => {
  it("makes one request per language with all its texts", async () => {
    const translations = await saveTranslations(sources, {}, {});

    expect(deepl.translateTexts).toHaveBeenCalledTimes(targetLanguages.length);
    expect(deepl.translateTexts).toHaveBeenCalledWith(["Минск", "Слон"], "en");
    expect(translations.en).toEqual({
      city: { edited: false, source: "Минск", text: "Минск (en)" },
      title: { edited: false, source: "Слон", text: "Слон (en)" },
    });
  });

  it("calls no translator when nothing changed", async () => {
    const saved = Object.fromEntries(
      targetLanguages.map((language) => [
        language,
        { title: { edited: false, source: "Слон", text: "Elephant" } },
      ]),
    );

    await expect(saveTranslations({ title: "Слон" }, saved, {})).resolves.toEqual(saved);
    expect(deepl.translateTexts).not.toHaveBeenCalled();
  });

  it("saves the other languages when one fails, which keeps its old text", async () => {
    const old = { edited: false, source: "Старый", text: "Old" };

    deepl.translateTexts.mockImplementation(async (texts: string[], language: string) => {
      if (language === "be") {
        throw new Error("Unavailable");
      }

      return texts;
    });

    const translations = await saveTranslations({ title: "Слон" }, { be: { title: old } }, {});

    expect(translations.be?.title).toEqual(old);
    expect(translations.en?.title).toEqual({ edited: false, source: "Слон", text: "Слон" });
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("saves without a translation when the translator fails for all", async () => {
    deepl.translateTexts.mockRejectedValue(new Error("DEEPL_API_KEY is not set"));

    await expect(saveTranslations({ title: "Слон" }, {}, {})).resolves.toEqual({});
  });
});
