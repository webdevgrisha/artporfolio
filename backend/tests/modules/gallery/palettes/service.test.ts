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

import { getGalleryPalettes, replaceGalleryPalettes } from "#modules/gallery/palettes/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const pastel = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Пастельная",
};
const bright = { id: "22222222-2222-4222-8222-222222222222", title: "Яркая" };
const palettes = { palettes: [pastel, bright] };
const noPalettes = { palettes: [] };

function snapshotOf(data: unknown) {
  return { data: () => data, exists: data !== undefined };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotOf(undefined));
  transaction.get.mockResolvedValue(snapshotOf(undefined));
});

describe("getGalleryPalettes", () => {
  it("returns no palettes before they are first saved", async () => {
    await expect(getGalleryPalettes()).resolves.toEqual({
      data: noPalettes,
      etag: entityTag(noPalettes),
    });
  });

  it("reads a saved title longer than today's limit, tagged by what is stored", async () => {
    const longer = { palettes: [{ id: "a", title: "a".repeat(100) }] };
    document.get.mockResolvedValue(snapshotOf(longer));

    await expect(getGalleryPalettes()).resolves.toEqual({
      data: longer,
      etag: entityTag(longer),
    });
  });
});

describe("replaceGalleryPalettes", () => {
  it("saves the palettes sorted by title and returns their new tag", async () => {
    await expect(
      replaceGalleryPalettes({ palettes: [bright, pastel] }, entityTag(noPalettes)),
    ).resolves.toEqual({ data: palettes, etag: entityTag(palettes) });
    expect(transaction.set).toHaveBeenCalledWith(document, palettes);
  });

  it("refuses palettes made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotOf(palettes));

    await expect(replaceGalleryPalettes(palettes, entityTag(noPalettes))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
