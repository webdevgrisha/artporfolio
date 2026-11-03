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

import { getGalleryColors, replaceGalleryColors } from "#modules/gallery-colors/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const blue = { id: "11111111-1111-4111-8111-111111111111", title: "Синий", hex: "#1f4e9c" };
const red = { id: "22222222-2222-4222-8222-222222222222", title: "Красный", hex: "#c0392b" };
const colors = { colors: [red, blue] };
const noColors = { colors: [] };

function snapshotOf(data: unknown) {
  return { data: () => data, exists: data !== undefined };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotOf(undefined));
  transaction.get.mockResolvedValue(snapshotOf(undefined));
});

describe("getGalleryColors", () => {
  it("returns no colors before they are first saved", async () => {
    await expect(getGalleryColors()).resolves.toEqual({
      data: noColors,
      etag: entityTag(noColors),
    });
  });

  it("reads a saved title longer than today's limit, tagged by what is stored", async () => {
    const longer = { colors: [{ id: "a", title: "a".repeat(100), hex: "#000000" }] };
    document.get.mockResolvedValue(snapshotOf(longer));

    await expect(getGalleryColors()).resolves.toEqual({ data: longer, etag: entityTag(longer) });
  });
});

describe("replaceGalleryColors", () => {
  it("saves the colors sorted by title and returns their new tag", async () => {
    await expect(
      replaceGalleryColors({ colors: [blue, red] }, entityTag(noColors)),
    ).resolves.toEqual({ data: colors, etag: entityTag(colors) });
    expect(transaction.set).toHaveBeenCalledWith(document, colors);
  });

  it("refuses colors made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotOf(colors));

    await expect(replaceGalleryColors(colors, entityTag(noColors))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
