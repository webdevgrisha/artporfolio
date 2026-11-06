import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ translateText: vi.fn() }));
const config = vi.hoisted(() => ({ getEnv: vi.fn() }));

vi.mock("deepl-node", () => ({
  DeepLClient: vi.fn(function DeepLClient() {
    return client;
  }),
}));
vi.mock("#shared/config/env", () => config);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  config.getEnv.mockReturnValue({ deeplApiKey: "key" });
});

describe("translateTexts", () => {
  it("translates from Russian and returns the texts in order, trimmed", async () => {
    const { translateTexts } = await import("#shared/i18n/deepl");

    client.translateText.mockResolvedValue([{ text: " Elephant " }, { text: "Minsk" }]);

    await expect(translateTexts(["Слон", "Минск"], "en")).resolves.toEqual(["Elephant", "Minsk"]);
    expect(client.translateText).toHaveBeenCalledWith(
      ["Слон", "Минск"],
      "ru",
      "en-GB",
      expect.objectContaining({ preserveFormatting: true }),
    );
  });

  it("names the regional variant DeepL needs", async () => {
    const { translateTexts } = await import("#shared/i18n/deepl");

    client.translateText.mockResolvedValue([{ text: "Elefante" }]);
    await translateTexts(["Слон"], "pt");
    await translateTexts(["Слон"], "zh");

    expect(client.translateText.mock.calls[0]?.[2]).toBe("pt-BR");
    expect(client.translateText.mock.calls[1]?.[2]).toBe("zh-HANS");
  });

  it("fails without a key, which a save survives", async () => {
    const { translateTexts } = await import("#shared/i18n/deepl");

    config.getEnv.mockReturnValue({});

    await expect(translateTexts(["Слон"], "en")).rejects.toThrow("DEEPL_API_KEY");
  });
});
