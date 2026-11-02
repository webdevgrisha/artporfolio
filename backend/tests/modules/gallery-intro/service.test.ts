import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    doc: () => document,
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));

import { getGalleryIntro, replaceGalleryIntro } from "#modules/gallery-intro/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const intro = { text: "Живопись, графика и постеры." };
const emptyIntro = { text: "" };

function snapshotOf(data: unknown) {
  return { data: () => data, exists: data !== undefined };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotOf(undefined));
  transaction.get.mockResolvedValue(snapshotOf(undefined));
});

describe("getGalleryIntro", () => {
  it("returns an empty text before it is first saved", async () => {
    await expect(getGalleryIntro()).resolves.toEqual({
      data: emptyIntro,
      etag: entityTag(emptyIntro),
    });
  });

  it("reads a saved text longer than today's limit, tagged by what is stored", async () => {
    const longer = { text: "a".repeat(2_000) };
    document.get.mockResolvedValue(snapshotOf(longer));

    await expect(getGalleryIntro()).resolves.toEqual({ data: longer, etag: entityTag(longer) });
  });
});

describe("replaceGalleryIntro", () => {
  it("saves the text and returns its new tag", async () => {
    await expect(replaceGalleryIntro(intro, entityTag(emptyIntro))).resolves.toEqual({
      data: intro,
      etag: entityTag(intro),
    });
    expect(transaction.set).toHaveBeenCalledWith(document, intro);
  });

  it("refuses a text made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotOf(intro));

    await expect(replaceGalleryIntro(intro, entityTag(emptyIntro))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
