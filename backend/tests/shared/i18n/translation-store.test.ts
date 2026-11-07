import { beforeEach, describe, expect, it, vi } from "vitest";

const documents = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const deepl = vi.hoisted(() => ({
  getTranslationUsage: vi.fn(),
  stopsTranslating: vi.fn(),
  translateTexts: vi.fn(),
}));
const queue = vi.hoisted(() => ({ enqueueTranslation: vi.fn() }));
const logger = vi.hoisted(() => ({ warn: vi.fn() }));
/** Set to make the next transactions fail, as a lost connection to Firestore would. */
const commit = vi.hoisted(() => ({ error: undefined as Error | undefined }));

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
    set: (
      target: { path: string },
      data: Record<string, unknown>,
      options?: { mergeFields: string[] },
    ) => {
      documents.set(target.path, options ? { ...documents.get(target.path), ...data } : data);
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
      runTransaction: async (update: (current: typeof transaction) => unknown) => {
        if (commit.error) {
          throw commit.error;
        }

        return update(transaction);
      },
    }),
  };
});

import { firestore } from "#shared/firebase/firestore";
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
  saveSources,
} from "#shared/i18n/translation-store";

const resource = "gallery-work-1";

/** A person's text, written from the Russian text the tests start with. */
function edit(text: string, source = "Слон") {
  return { source, text };
}

/** A save of a resource with its texts, as the services do it. */
async function save(saved: string, sources: Record<string, string>): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    saveSources(transaction, saved, sources);
  });
  await requestTranslations(saved);
}

beforeEach(() => {
  documents.clear();
  commit.error = undefined;
  vi.clearAllMocks();
  queue.enqueueTranslation.mockReset();
  deepl.stopsTranslating.mockReturnValue(null);
  deepl.translateTexts.mockImplementation(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  );
});

describe("a failure of the queue or of the worker", () => {
  async function translated(): Promise<void> {
    await save(resource, { title: "Слон" });
    await runTranslation(resource, false);
    await editTranslations(resource, "en", { title: edit("My Elephant") });
    queue.enqueueTranslation.mockClear();
  }

  it("keeps the text asked anew, and shows it as failed, when the queue refuses", async () => {
    await translated();
    queue.enqueueTranslation.mockRejectedValue(new Error("no queue"));

    await expect(editTranslations(resource, "en", { title: null })).rejects.toThrow("no queue");

    const { failed, isTranslating, translations } = await getTranslations(resource);

    expect({ failed, isTranslating }).toEqual({ failed: true, isTranslating: false });
    expect(translations.en?.title).toEqual({ status: "pending", text: "My Elephant" });
  });

  it("keeps the text asked anew while translating is halted", async () => {
    await translated();
    documents.set("site/translation", { halted: "limit" });

    await editTranslations(resource, "en", { title: null });

    expect((await getTranslations(resource)).translations.en?.title?.text).toBe("My Elephant");
  });

  it("replaces the text asked anew once the translator makes it", async () => {
    await translated();
    await editTranslations(resource, "en", { title: null });

    await runTranslation(resource, false);

    expect((await getTranslations(resource)).translations.en?.title).toEqual({
      status: "auto",
      text: "Слон (en)",
    });
  });

  it("leaves a failure in place when a person edits one text", async () => {
    deepl.translateTexts.mockRejectedValue(new Error("DeepL is down"));
    await save(resource, { title: "Слон" });
    await expect(runTranslation(resource, true)).rejects.toThrow("DeepL is down");
    queue.enqueueTranslation.mockClear();

    await editTranslations(resource, "en", { title: edit("Elephant") });

    expect(queue.enqueueTranslation).not.toHaveBeenCalled();
    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("shows the texts as failed when the last try cannot write them", async () => {
    await save(resource, { title: "Слон" });
    commit.error = new Error("lost");

    await expect(runTranslation(resource, true)).rejects.toThrow("lost");

    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("asks DeepL for nothing once translating is halted, though the task is queued", async () => {
    await save(resource, { title: "Слон" });
    documents.set("site/translation", { halted: "paused" });

    await runTranslation(resource, false);

    expect(deepl.translateTexts).not.toHaveBeenCalled();
  });

  it("goes on with the other resources when the queue refuses one", async () => {
    await save(resource, { title: "Слон" });
    await save("gallery-work-2", { title: "Тигр" });
    queue.enqueueTranslation.mockReset();
    queue.enqueueTranslation.mockRejectedValueOnce(new Error("no queue"));

    await expect(retryTranslations()).rejects.toThrow("no queue");

    expect(queue.enqueueTranslation).toHaveBeenCalledTimes(2);
    expect((await getTranslations(resource)).failed).toBe(true);
    expect((await getTranslations("gallery-work-2")).failed).toBe(false);
  });
});

describe("an edit of an older text", () => {
  it("shows as out of date, and stays until a person replaces it", async () => {
    await save(resource, { title: "Слон" });
    await save(resource, { title: "Тигр" });

    const { translations } = await editTranslations(resource, "en", {
      title: edit("Elephant", "Слон"),
    });

    expect(translations.en?.title).toEqual({ status: "outdated", text: "Elephant" });
  });
});

describe("requestTranslations", () => {
  it("records the texts and puts the resource in the queue, without waiting for DeepL", async () => {
    await save(resource, { title: "Слон" });

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
    await save(resource, { title: "Слон" });
    await runTranslation(resource, false);
    queue.enqueueTranslation.mockClear();

    await save(resource, { title: "Слон" });

    expect(queue.enqueueTranslation).not.toHaveBeenCalled();
  });

  it("queues nothing while translating is halted; a retry does", async () => {
    documents.set("site/translation", { halted: "limit" });

    await save(resource, { title: "Слон" });

    expect(queue.enqueueTranslation).not.toHaveBeenCalled();

    await retryTranslations();

    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
    expect(documents.get("site/translation")).toEqual({ halted: null });
  });

  it("never fails the save it follows, and shows the texts as failed", async () => {
    queue.enqueueTranslation.mockRejectedValue(new Error("Unavailable"));

    await expect(save(resource, { title: "Слон" })).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledOnce();
    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("works from the texts last saved, however late a request of an earlier save comes", async () => {
    await save(resource, { title: "Тигр" });
    await requestTranslations(resource);
    await runTranslation(resource, false);

    expect((await getTranslations(resource)).sources).toEqual({ title: "Тигр" });
    expect(deepl.translateTexts).toHaveBeenCalledWith(
      ["Тигр"],
      "en",
      "Название и описание картины на сайте художника",
    );
  });

  it("does not say the texts are on their way while translating is halted", async () => {
    documents.set("site/translation", { halted: "limit" });

    await save(resource, { title: "Слон" });

    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });
});

describe("runTranslation", () => {
  it("makes every language", async () => {
    await save(resource, { title: "Слон" });
    await runTranslation(resource, false);

    const { isTranslating, translations } = await getTranslations(resource);

    expect(isTranslating).toBe(false);
    expect(Object.keys(translations)).toHaveLength(targetLanguages.length);
    expect(translations.en?.title).toEqual({ status: "auto", text: "Слон (en)" });
  });

  it("shows the old text as pending until the new one is made", async () => {
    await save(resource, { title: "Слон" });
    await runTranslation(resource, false);
    await save(resource, { title: "Тигр" });

    const { translations } = await getTranslations(resource);

    expect(translations.en?.title).toEqual({ status: "pending", text: "Слон (en)" });
  });

  it("leaves a text a person edited while the translator worked", async () => {
    await save(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementation(async (texts: string[], language: string) => {
      if (language === "en") {
        await editTranslations(resource, "en", { title: edit("Elephant") });
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
    await save(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementationOnce(async (texts: string[]) => {
      await save(resource, { title: "Тигр" });

      return texts;
    });

    await runTranslation(resource, false);

    expect((await getTranslations(resource)).translations.en).toBeUndefined();
  });

  it("leaves nothing behind of a resource deleted while the translator worked", async () => {
    await save(resource, { title: "Слон" });
    deepl.translateTexts.mockImplementationOnce(async (texts: string[]) => {
      await deleteTranslations(resource);

      return texts;
    });

    await runTranslation(resource, false);

    expect(documents.has(`translations/${resource}`)).toBe(false);
  });

  it("saves what it made and throws for the queue to try again", async () => {
    const failure = new Error("Too many requests");

    await save(resource, { title: "Слон" });
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
    await save(resource, { title: "Слон" });
    deepl.translateTexts.mockRejectedValue(new Error("Unavailable"));

    await expect(runTranslation(resource, true)).rejects.toThrow("Unavailable");

    await expect(getTranslations(resource)).resolves.toMatchObject({
      failed: true,
      isTranslating: false,
    });
  });

  it("halts translating on the end of the plan, without trying again", async () => {
    await save(resource, { title: "Слон" });
    deepl.translateTexts.mockRejectedValue(new Error("Quota"));
    deepl.stopsTranslating.mockReturnValue("limit");

    await expect(runTranslation(resource, false)).resolves.toBeUndefined();

    expect(documents.get("site/translation")).toEqual({ halted: "limit" });
  });
});

describe("editTranslations", () => {
  it("saves a person's text", async () => {
    await save(resource, { title: "Слон" });

    const { translations } = await editTranslations(resource, "en", { title: edit("Elephant") });

    expect(translations.en?.title).toEqual({ status: "edited", text: "Elephant" });
  });

  it("asks the translator for a text anew, and keeps the old one until then", async () => {
    await save(resource, { title: "Слон" });
    await editTranslations(resource, "en", { title: edit("Elephant") });
    queue.enqueueTranslation.mockClear();

    const { translations } = await editTranslations(resource, "en", { title: null });

    expect(translations.en?.title?.status).toBe("pending");
    expect(queue.enqueueTranslation).toHaveBeenCalledWith(resource);
  });

  it("rejects a text that has no source", async () => {
    await expect(
      editTranslations(resource, "en", { title: edit("Elephant") }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
  });
});

describe("deleteTranslations", () => {
  it("drops the translations of a deleted resource", async () => {
    await save(resource, { title: "Слон" });
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
