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

import { getGalleryMaterials, replaceGalleryMaterials } from "#modules/gallery/materials/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const watercolor = { id: "11111111-1111-4111-8111-111111111111", title: "Акварель" };
const gouache = { id: "22222222-2222-4222-8222-222222222222", title: "Гуашь" };
const materials = { materials: [watercolor, gouache] };
const noMaterials = { materials: [] };

function snapshotOf(data: unknown) {
  return { data: () => data, exists: data !== undefined };
}

beforeEach(() => {
  vi.clearAllMocks();
  document.get.mockResolvedValue(snapshotOf(undefined));
  transaction.get.mockResolvedValue(snapshotOf(undefined));
});

describe("getGalleryMaterials", () => {
  it("returns no materials before they are first saved", async () => {
    await expect(getGalleryMaterials()).resolves.toEqual({
      data: noMaterials,
      etag: entityTag(noMaterials),
    });
  });

  it("reads a saved title longer than today's limit, tagged by what is stored", async () => {
    const longer = { materials: [{ id: "a", title: "a".repeat(100) }] };
    document.get.mockResolvedValue(snapshotOf(longer));

    await expect(getGalleryMaterials()).resolves.toEqual({ data: longer, etag: entityTag(longer) });
  });
});

describe("replaceGalleryMaterials", () => {
  it("saves the materials sorted by title and returns their new tag", async () => {
    await expect(
      replaceGalleryMaterials({ materials: [gouache, watercolor] }, entityTag(noMaterials)),
    ).resolves.toEqual({ data: materials, etag: entityTag(materials) });
    expect(transaction.set).toHaveBeenCalledWith(document, materials);
  });

  it("refuses materials made from an outdated read", async () => {
    transaction.get.mockResolvedValue(snapshotOf(materials));

    await expect(replaceGalleryMaterials(materials, entityTag(noMaterials))).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
