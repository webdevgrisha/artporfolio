import { beforeEach, describe, expect, it, vi } from "vitest";

const deepl = vi.hoisted(() => ({
  getTranslationUsage: vi.fn(),
  stopsTranslating: vi.fn(() => null),
  translateTexts: vi.fn(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  ),
}));
const queue = vi.hoisted(() => ({ enqueueTranslation: vi.fn() }));

vi.mock("#modules/translations/deepl", () => deepl);
vi.mock("#shared/i18n/translation-queue", () => queue);

import { aboutText } from "#modules/about/text/resource";
import { editTranslations, getTranslations } from "#modules/translations/service";
import { runTranslation } from "#modules/translations/worker";
import { firestore } from "#shared/firebase/firestore";
import { targetLanguages } from "#shared/i18n/languages";

const resource = "about-text";

async function saveText(about: string): Promise<void> {
  const { data, etag } = await aboutText.get();

  await aboutText.replace({ ...data, about, biography: "Биография", creation: "Творчество" }, etag);
}

beforeEach(async () => {
  vi.clearAllMocks();
  await firestore().doc("site/translation").delete();
  await firestore().collection("translations").doc(resource).delete();
});

describe("translations on Firestore", () => {
  it("records the texts with their save, and the task makes every language", async () => {
    await saveText("Обо мне");

    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
    await expect(getTranslations(resource)).resolves.toMatchObject({
      isTranslating: true,
      sources: { about: "Обо мне" },
      translations: {},
    });

    await runTranslation(resource, false);

    const { isTranslating, translations } = await getTranslations(resource);

    expect(isTranslating).toBe(false);
    expect(Object.keys(translations)).toHaveLength(targetLanguages.length);
    expect(translations.en?.about).toEqual({ status: "auto", text: "Обо мне (en)" });
  });

  it("keeps a person's edit through a new save, and shows it as out of date", async () => {
    await saveText("Обо мне");
    await runTranslation(resource, false);
    await editTranslations(resource, "en", { about: { source: "Обо мне", text: "About me" } });

    await saveText("Немного обо мне");
    await runTranslation(resource, false);

    const { translations } = await getTranslations(resource);

    expect(translations.en?.about).toEqual({ status: "outdated", text: "About me" });
    expect(translations.pl?.about).toEqual({ status: "auto", text: "Немного обо мне (pl)" });
  });

  it("keeps a text asked anew until the new one is made", async () => {
    await saveText("Обо мне");
    await runTranslation(resource, false);
    await editTranslations(resource, "en", { about: { source: "Обо мне", text: "About me" } });

    const { translations } = await editTranslations(resource, "en", { about: null });

    expect(translations.en?.about).toEqual({ status: "pending", text: "About me" });

    await runTranslation(resource, false);

    expect((await getTranslations(resource)).translations.en?.about).toEqual({
      status: "auto",
      text: "Обо мне (en)",
    });
  });
});
