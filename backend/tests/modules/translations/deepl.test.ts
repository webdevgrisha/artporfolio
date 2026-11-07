import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ getUsage: vi.fn(), translateText: vi.fn() }));

vi.mock("deepl-node", () => ({
  DeepLClient: vi.fn(function DeepLClient() {
    return client;
  }),
}));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv("DEEPL_API_KEY", "key");
});

describe("translateTexts", () => {
  it("translates from Russian and returns the texts in order, trimmed", async () => {
    const { translateTexts } = await import("#modules/translations/deepl");

    client.translateText.mockResolvedValue([{ text: " Elephant " }, { text: "Minsk" }]);

    await expect(translateTexts(["Слон", "Минск"], "en", "Картина")).resolves.toEqual([
      "Elephant",
      "Minsk",
    ]);
    expect(client.translateText).toHaveBeenCalledWith(
      ["Слон", "Минск"],
      "ru",
      "en-GB",
      expect.objectContaining({ preserveFormatting: true }),
    );
  });

  it("names the regional variant DeepL needs", async () => {
    const { translateTexts } = await import("#modules/translations/deepl");

    client.translateText.mockResolvedValue([{ text: "Elefante" }]);
    await translateTexts(["Слон"], "pt", "Картина");
    await translateTexts(["Слон"], "zh", "Картина");

    expect(client.translateText.mock.calls[0]?.[2]).toBe("pt-BR");
    expect(client.translateText.mock.calls[1]?.[2]).toBe("zh-HANS");
  });

  it("fails without a key, which a save survives", async () => {
    const { translateTexts } = await import("#modules/translations/deepl");

    vi.stubEnv("DEEPL_API_KEY", "");

    await expect(translateTexts(["Слон"], "en", "Картина")).rejects.toThrow("DEEPL_API_KEY");
  });
});

describe("getTranslationUsage", () => {
  it("asks DeepL once for a while, as it limits every request", async () => {
    const { getTranslationUsage } = await import("#modules/translations/deepl");

    client.getUsage.mockResolvedValue({ character: { count: 90, limit: 100 } });

    await expect(getTranslationUsage()).resolves.toEqual({ limit: 100, used: 90 });
    await getTranslationUsage();

    expect(client.getUsage).toHaveBeenCalledOnce();
  });

  it("does not know the use when DeepL does not answer", async () => {
    const { getTranslationUsage } = await import("#modules/translations/deepl");

    client.getUsage.mockRejectedValue(new Error("Too many requests"));

    await expect(getTranslationUsage()).resolves.toBeNull();
  });
});
