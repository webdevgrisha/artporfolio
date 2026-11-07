import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const store = vi.hoisted(() => ({ data: undefined as Record<string, unknown> | undefined }));
const deepl = vi.hoisted(() => ({ translateTexts: vi.fn() }));

vi.mock("#shared/i18n/deepl", () => deepl);
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));
vi.mock("#shared/firebase/firestore", () => {
  const snapshot = () => ({ data: () => store.data, get: () => undefined });
  const transaction = {
    get: async () => snapshot(),
    set: (_reference: unknown, fields: Record<string, unknown>) => {
      store.data = fields;
    },
  };

  return {
    firestore: () => ({
      runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
    }),
  };
});

import { PreconditionFailedError } from "#shared/http/errors";
import { translatedResource } from "#shared/i18n/translated-resource";

const reference = {
  get: async () => ({ data: () => store.data, get: () => undefined }),
};
const intro = translatedResource<{ text: string }>({
  document: () => reference as never,
  empty: { text: "" },
  schema: z.object({ text: z.string() }),
  sources: ({ text }) => ({ text }),
});

beforeEach(() => {
  store.data = undefined;
  deepl.translateTexts.mockReset();
  deepl.translateTexts.mockImplementation(async (texts: string[], language: string) =>
    texts.map((text) => `${text} (${language})`),
  );
});

describe("translatedResource", () => {
  it("is empty until it is first saved", async () => {
    const { data } = await intro.get();

    expect(data).toEqual({ text: "", translations: {} });
  });

  it("translates a replaced text and returns it with its status, not its source", async () => {
    const { etag } = await intro.get();
    const saved = await intro.replace({ text: "Живопись", translations: {} }, etag);

    expect(saved.data.translations.en).toEqual({
      text: { status: "auto", text: "Живопись (en)" },
    });
    expect(store.data?.translations).toMatchObject({
      en: { text: { edited: false, source: "Живопись", text: "Живопись (en)" } },
    });
    expect((await intro.get()).etag).toBe(saved.etag);
  });

  it("keeps a person's edit when the source changes", async () => {
    const first = await intro.replace(
      { text: "Живопись", translations: {} },
      (await intro.get()).etag,
    );
    const edited = await intro.replace(
      { text: "Живопись", translations: { en: { text: "Painting" } } },
      first.etag,
    );
    const { data } = await intro.replace({ text: "Графика", translations: {} }, edited.etag);

    expect(data.translations.en?.text).toEqual({ status: "outdated", text: "Painting" });
  });

  it("pays for no translation of a change it rejects with 412", async () => {
    await expect(
      intro.replace({ text: "Живопись", translations: {} }, '"stale"'),
    ).rejects.toBeInstanceOf(PreconditionFailedError);
    expect(deepl.translateTexts).not.toHaveBeenCalled();
  });
});
