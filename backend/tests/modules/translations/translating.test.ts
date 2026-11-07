import { beforeEach, describe, expect, it, vi } from "vitest";

const deepl = vi.hoisted(() => ({ translateTexts: vi.fn() }));

vi.mock("#modules/translations/deepl", () => deepl);

import { translateAll } from "#modules/translations/translating";
import { targetLanguages } from "#shared/i18n/languages";
import { planTranslations } from "#shared/i18n/translations";

const sources = { city: "Минск", title: "Слон" };
const { requests } = planTranslations(sources, {});

beforeEach(() => {
  vi.clearAllMocks();
  deepl.translateTexts.mockImplementation(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  );
});

describe("translateAll", () => {
  it("makes one request per language with all its texts", async () => {
    const { errors, made } = await translateAll(sources, requests, "Картина");

    expect(errors).toEqual([]);
    expect(deepl.translateTexts).toHaveBeenCalledTimes(targetLanguages.length);
    expect(deepl.translateTexts).toHaveBeenCalledWith(["Минск", "Слон"], "en", "Картина");
    expect(made).toContainEqual({
      key: "title",
      language: "en",
      translation: { edited: false, source: "Слон", text: "Слон (en)" },
    });
  });

  it("keeps the requests at once within what DeepL takes", async () => {
    let running = 0;
    let most = 0;

    deepl.translateTexts.mockImplementation(async (texts: string[]) => {
      running += 1;
      most = Math.max(most, running);
      await Promise.resolve();
      running -= 1;

      return texts;
    });

    await translateAll(sources, requests, "Картина");

    expect(most).toBe(4);
  });

  it("gives what it made and the error of the language that failed", async () => {
    const failure = new Error("Unavailable");

    deepl.translateTexts.mockImplementation(async (texts: string[], language: string) => {
      if (language === "be") {
        throw failure;
      }

      return texts;
    });

    const { errors, made } = await translateAll(sources, requests, "Картина");

    expect(errors).toEqual([failure]);
    expect(made.some(({ language }) => language === "be")).toBe(false);
    expect(made.some(({ language }) => language === "en")).toBe(true);
  });
});
