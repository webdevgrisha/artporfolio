import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `galleryWorks` collection: documents by id. */
const works = vi.hoisted(() => new Map<string, Record<string, unknown>>());

/** The `translations` collection: documents by resource. */
const translations = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const getAll = vi.hoisted(() => vi.fn());

vi.mock("#shared/firebase/firestore", () => {
  function snapshot(collection: Map<string, Record<string, unknown>>, id: string) {
    const data = collection.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  getAll.mockImplementation(async (...refs: { id: string }[]) =>
    refs.map(({ id }) => snapshot(translations, id)),
  );

  return {
    firestore: () => ({
      collection: (name: string) =>
        name === "translations"
          ? { doc: (id: string) => ({ id }) }
          : { get: async () => ({ docs: [...works.keys()].map((id) => snapshot(works, id)) }) },
      getAll,
    }),
  };
});
vi.mock("#shared/firebase/storage", () => ({
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

import { landscapeWorkPhotos } from "#modules/gallery/works/landscape-photos";

const createdAt = Timestamp.fromDate(new Date("2026-01-15T10:00:00.000Z"));

function storedWork(
  id: string,
  { height, month, published = true, width }: Record<string, number | boolean>,
) {
  const folder = `galleryWorks/${id}/photo/version`;

  return {
    city: "",
    collectionId: null,
    colorIds: [],
    country: null,
    createdAt,
    description: "",
    format: "single",
    materialIds: [],
    month,
    paletteIds: [],
    partCount: null,
    photo: {
      alt: `Работа ${id}`,
      fileName: "work.png",
      fileSize: 100,
      height,
      originalPath: `${folder}/original.png`,
      placeholder: "data:image/webp;base64,UklGRg==",
      sources: {
        avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
        webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
      },
      version: "version",
      width,
    },
    price: null,
    processPhotos: [],
    published,
    saleStatus: "available",
    sectionIds: [],
    size: { height: 50, width: 70 },
    title: id,
    updatedAt: createdAt,
    year: 2026,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  works.clear();
  translations.clear();
});

describe("landscapeWorkPhotos", () => {
  it("returns the photos of the published works wider than tall, in the order of the gallery", async () => {
    works.set("earlier", storedWork("earlier", { height: 600, month: 1, width: 900 }));
    works.set("later", storedWork("later", { height: 600, month: 3, width: 900 }));
    works.set("portrait", storedWork("portrait", { height: 900, month: 2, width: 600 }));
    works.set("square", storedWork("square", { height: 600, month: 2, width: 600 }));
    works.set(
      "hidden",
      storedWork("hidden", { height: 600, month: 2, published: false, width: 900 }),
    );

    const photos = await landscapeWorkPhotos("ru");

    expect(photos.map(({ alt }) => alt)).toEqual(["Работа later", "Работа earlier"]);
    expect(photos[0]?.sources.avif[0]?.url).toBe(
      "https://storage.test/galleryWorks/later/photo/version/640.avif?token=token",
    );
    expect(getAll).not.toHaveBeenCalled();
  });

  it("returns the alt texts in the language asked for, read in one request", async () => {
    works.set("first", storedWork("first", { height: 600, month: 3, width: 900 }));
    works.set("second", storedWork("second", { height: 600, month: 1, width: 900 }));
    translations.set("gallery-work-first", {
      failed: false,
      sources: { alt: "Работа first" },
      translations: { pl: { alt: { edited: false, source: "Работа first", text: "Praca" } } },
    });

    const photos = await landscapeWorkPhotos("pl");

    expect(photos.map(({ alt }) => alt)).toEqual(["Praca", "Работа second"]);
    expect(getAll).toHaveBeenCalledOnce();
  });

  it("returns none when no work is published", async () => {
    await expect(landscapeWorkPhotos("pl")).resolves.toEqual([]);
    expect(getAll).not.toHaveBeenCalled();
  });
});
