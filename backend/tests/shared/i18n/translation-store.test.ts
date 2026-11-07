import { beforeEach, describe, expect, it, vi } from "vitest";

const documents = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const deepl = vi.hoisted(() => ({
  getTranslationUsage: vi.fn(),
  stopsTranslating: vi.fn(),
  translateTexts: vi.fn(),
}));
const queue = vi.hoisted(() => ({ enqueueTranslation: vi.fn() }));
const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("#shared/i18n/deepl", () => deepl);
vi.mock("#shared/i18n/translation-queue", () => queue);
vi.mock("firebase-functions/logger", () => logger);
vi.mock("#shared/firebase/firestore", () => {
  function reference(path: string) {
    return {
      delete: async () => documents.delete(path),
      get: async () => snapshot(path),
      path,
      set: async (data: Record<string, unknown>) => documents.set(path, data),
      update: async (data: Record<string, unknown>) =>
        documents.set(path, { ...documents.get(path), ...data }),
    };
  }

  function snapshot(path: string) {
    const data = documents.get(path);

    return {
      data: () => data,
      exists: data !== undefined,
      id: path.split("/").at(-1),
      ref: reference(path),
    };
  }

  const transaction = {
    get: (target: { path: string }) => snapshot(target.path),
    set: (target: { path: string }, data: Record<string, unknown>) => {
      documents.set(target.path, data);
    },
  };

  return {
    firestore: () => ({
      collection: (name: string) => ({
        doc: (id: string) => reference(`${name}/${id}`),
        get: async () => ({
          docs: [...documents.keys()]
            .filter((path) => path.startsWith(`${name}/`))
            .map((path) => snapshot(path)),
        }),
      }),
      doc: reference,
      runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
    }),
  };
});

import { UnprocessableContentError } from "#shared/http/errors";
import { targetLanguages } from "#shared/i18n/languages";
import {
  deleteTranslations,
  editTranslations,
  getTranslationStatus,
  getTranslations,
  requestTranslations,
  retryTranslations,
  runTranslation,
} from "#shared/i18n/translation-store";

const resource = "gallery-work-1";

beforeEach(() => {
  documents.clear();
  vi.clearAllMocks();
  queue.enqueueTranslation.mockReset();
  deepl.stopsTranslating.mockReturnValue(null);
  deepl.translateTexts.mockImplementation(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  );
});

describe("requestTranslations", () => {
  it("records the texts and puts the resource in the queue, without waiting for DeepL", async () => {
    await requestTranslations(resource, { title: "Слон" });

    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
    expect(deepl.translateTexts).not.toHaveBeenCalled();
    await expect(getTranslations(resource)).resolves.toEqual({
      failed: false,
      isTranslating: true,
      sources: { title: "Слон" },
      translations: {},
    });
  });

  it("asks for nothing when the texts did not change", async () => {
    await requestTranslations(resource, { title: "Слон" });
    await runTranslation(resource, false);
    queue.enqueueTranslation.mockClear();

    await requestTranslations(resource, { title: "Слон" });

    expect(queue.enqueueTranslation).not.toHaveBeenCalled();
  });

  it("queues nothing while translating is halted; a retry does", async () => {
    documents.set("site/translation", { halted: "limit" });

    await requestTranslations(resource, { title: "Слон" });

    expect(queue.enqueueTranslation).not.toHaveBeenCalled();

    await retryTranslations();

    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
    expect(documents.get("site/translation")).toEqual({ halted: null });
  });

  it("never fails the save it follows, and shows the texts as failed", async () => {
    queue.enqueueTranslation.mockRejectedValue(new Error("Unavailable"));

    await expect(requestTranslations(resource, { title: "Слон" })).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledOnce();
    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("does not say the texts are on their way while translating is halted", async () => {
    documents.set("site/translation", { halted: "limit" });

    await requestTranslations(resource, { title: "Слон" });

    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });
});

describe("runTranslation", () => {
  it("makes every language", async () => {
    await requestTranslations(resource, { title: "Слон" });
    await runTranslation(resource, false);

    const { isTranslating, translations } = await getTranslations(resource);

    expect(isTranslating).toBe(false);
    expect(Object.keys(translations)).toHaveLength(targetLanguages.length);
    expect(translations.en?.title).toEqual({ status: "auto", text: "Слон (en)" });
  });

  it("shows the old text as pending until the new one is made", async () => {
    await requestTranslations(resource, { title: "Слон" });
    await runTranslation(resource, false);
    await requestTranslations(resource, { title: "Тигр" });

    const { translations } = await getTranslations(resource);

    expect(translations.en?.title).toEqual({ status: "pending", text: "Слон (en)" });
  });

  it("leaves a text a person edited while the translator worked", async () => {
    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementation(async (texts: string[], language: string) => {
      if (language === "en") {
        await editTranslations(resource, "en", { title: "Elephant" });
      }

      return texts;
    });

    await runTranslation(resource, false);

    expect((await getTranslations(resource)).translations.en?.title).toEqual({
      status: "edited",
      text: "Elephant",
    });
  });

  it("drops a text whose source changed while the translator worked", async () => {
    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementationOnce(async (texts: string[]) => {
      await requestTranslations(resource, { title: "Тигр" });

      return texts;
    });

    await runTranslation(resource, false);

    expect((await getTranslations(resource)).translations.en).toBeUndefined();
  });

  it("leaves nothing behind of a resource deleted while the translator worked", async () => {
    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementationOnce(async (texts: string[]) => {
      await deleteTranslations(resource);

      return texts;
    });

    await runTranslation(resource, false);

    expect(documents.has(`translations/${resource}`)).toBe(false);
  });

  it("saves what it made and throws for the queue to try again", async () => {
    const failure = new Error("Too many requests");

    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementation(async (texts: string[], language: string) => {
      if (language === "be") {
        throw failure;
      }

      return texts;
    });

    await expect(runTranslation(resource, false)).rejects.toBe(failure);

    const { failed, isTranslating, translations } = await getTranslations(resource);

    expect(failed).toBe(false);
    expect(isTranslating).toBe(true);
    expect(translations.en).toBeDefined();
    expect(translations.be).toBeUndefined();
  });

  it("shows the texts as failed after the last try", async () => {
    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockRejectedValue(new Error("Unavailable"));

    await expect(runTranslation(resource, true)).rejects.toThrow("Unavailable");

    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("halts translating on the end of the plan, without trying again", async () => {
    await requestTranslations(resource, { title: "Слон" });
    deepl.translateTexts.mockRejectedValue(new Error("Quota"));
    deepl.stopsTranslating.mockReturnValue("limit");

    await expect(runTranslation(resource, false)).resolves.toBeUndefined();

    expect(documents.get("site/translation")).toEqual({ halted: "limit" });
  });
});

describe("editTranslations", () => {
  it("saves a person's text", async () => {
    await requestTranslations(resource, { title: "Слон" });

    const { translations } = await editTranslations(resource, "en", { title: "Elephant" });

    expect(translations.en?.title).toEqual({ status: "edited", text: "Elephant" });
  });

  it("removes a text for the translator to make it anew", async () => {
    await requestTranslations(resource, { title: "Слон" });
    await editTranslations(resource, "en", { title: "Elephant" });
    queue.enqueueTranslation.mockClear();

    const { translations } = await editTranslations(resource, "en", { title: null });

    expect(translations.en).toBeUndefined();
    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
  });

  it("rejects a text that has no source", async () => {
    await expect(editTranslations(resource, "en", { title: "Elephant" })).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
  });
});

describe("deleteTranslations", () => {
  it("drops the translations of a deleted resource", async () => {
    await requestTranslations(resource, { title: "Слон" });
    await deleteTranslations(resource);

    expect(documents.size).toBe(0);
  });
});

describe("getTranslationStatus", () => {
  it("tells the halt and the use of the plan", async () => {
    documents.set("site/translation", { halted: "paused" });
    deepl.getTranslationUsage.mockResolvedValue({ limit: 100, used: 90 });

    await expect(getTranslationStatus()).resolves.toEqual({
      halted: "paused",
      usage: { limit: 100, used: 90 },
    });
  });
});
