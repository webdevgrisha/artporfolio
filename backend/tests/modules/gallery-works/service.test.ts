import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `galleryWorks` collection: documents by id. Transactions write to it at once. */
const works = vi.hoisted(() => new Map<string, Record<string, unknown>>());

/** The `gallerySections` collection, which the works refer to. */
const sections = vi.hoisted(() => new Map<string, Record<string, unknown>>());

/** The `galleryCollections` collection, which a work may be in. */
const collections = vi.hoisted(() => new Map<string, Record<string, unknown>>());

/** The `site/…` documents of the lists the works refer to, such as `site/galleryMaterials`. */
const lists = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const uploads = vi.hoisted(() => ({
  publishUpload: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => {
  function snapshot(collection: Map<string, Record<string, unknown>>, id: string) {
    const data = collection.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  function collectionNamed(name: string) {
    const collection =
      name === "gallerySections" ? sections : name === "galleryCollections" ? collections : works;

    return {
      doc: (id: string) => ({ get: async () => snapshot(collection, id), id }),
      get: async () => ({ docs: [...collection.keys()].map((id) => snapshot(collection, id)) }),
      where: (field: string, _operator: "==", value: unknown) => ({
        count: () => ({
          get: async () => ({
            data: () => ({
              count: [...collection.values()].filter((data) => data[field] === value).length,
            }),
          }),
        }),
      }),
    };
  }

  const transaction = {
    create: (ref: { id: string }, data: Record<string, unknown>) => works.set(ref.id, data),
    delete: (ref: { id: string }) => works.delete(ref.id),
    get: (target: { get: () => unknown }) => target.get(),
    set: (ref: { id: string }, data: Record<string, unknown>) => works.set(ref.id, data),
  };

  function siteDocument(path: string) {
    return {
      get: async () => ({ data: () => lists.get(path), exists: lists.has(path) }),
    };
  }

  return {
    firestore: () => ({
      collection: collectionNamed,
      doc: siteDocument,
      runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
    }),
  };
});
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...uploads,
}));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { Timestamp } from "firebase-admin/firestore";

import { maxCollectionWorks } from "#modules/gallery-collections/schema";
import type { WorkBody } from "#modules/gallery-works/schema";
import {
  createWork,
  deleteWork,
  getWork,
  listWorks,
  replaceWork,
} from "#modules/gallery-works/service";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const elephantId = "11111111-1111-4111-8111-111111111111";
const tigerId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";
const processUploadId = "77777777-7777-4777-8777-777777777777";
const newId = "55555555-5555-4555-8555-555555555555";
const processPhotoId = "66666666-6666-4666-8666-666666666666";
const animalsId = "88888888-8888-4888-8888-888888888888";
const birdsId = "99999999-9999-4999-8999-999999999999";
const deletedSectionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const oilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const canvasId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const deletedMaterialId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const blackId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const whiteId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const deletedColorId = "12121212-1212-4212-8212-121212121212";
const pastelId = "13131313-1313-4313-8313-131313131313";
const brightId = "14141414-1414-4414-8414-141414141414";
const deletedPaletteId = "15151515-1515-4515-8515-151515151515";
const animalsCollectionId = "16161616-1616-4616-8616-161616161616";
const deletedCollectionId = "17171717-1717-4717-8717-171717171717";

function storedPhoto(workId: string) {
  const folder = `galleryWorks/${workId}/photo/old-version`;

  return {
    alt: "Старое фото",
    fileName: "old.png",
    fileSize: 100,
    height: 320,
    originalPath: `${folder}/original.png`,
    sources: {
      avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
      webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
    },
    version: "old-version",
    width: 640,
  };
}

function storedProcessPhoto(workId: string) {
  const folder = `galleryWorks/${workId}/process/${processPhotoId}/old-version`;

  return {
    alt: "Набросок",
    fileName: "sketch.png",
    fileSize: 100,
    height: 320,
    id: processPhotoId,
    originalPath: `${folder}/original.png`,
    sources: {
      avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
      webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
    },
    version: "old-version",
    width: 640,
  };
}

/** When the seeded works were made and last saved. */
const seededAt = Timestamp.fromDate(new Date("2026-01-15T10:00:00.000Z"));

function storedWork(id: string, title: string, year: number, month: number, createdAt = seededAt) {
  return {
    createdAt,
    description: "",
    month,
    photo: storedPhoto(id),
    processPhotos: [storedProcessPhoto(id)],
    sectionIds: [animalsId, deletedSectionId],
    materialIds: [oilId, deletedMaterialId],
    colorIds: [blackId, deletedColorId],
    paletteIds: [pastelId, deletedPaletteId],
    collectionId: null,
    size: { width: 50, height: 70 },
    title,
    updatedAt: createdAt,
    year,
  };
}

/** The image publishUpload makes from an upload, in a new version under `folder`. */
function publishedImage(folder: string) {
  return {
    fileName: "new.png",
    fileSize: 200,
    height: 480,
    originalPath: `${folder}/new-version/original.png`,
    sources: {
      avif: [{ path: `${folder}/new-version/960.avif`, token: "new-token", width: 960 }],
      webp: [{ path: `${folder}/new-version/960.webp`, token: "new-token", width: 960 }],
    },
    version: "new-version",
    width: 960,
  };
}

const body: WorkBody = {
  description: "Масло, холст.",
  photo: { alt: "Новое фото", uploadId },
  processPhotos: [],
  sectionIds: [birdsId],
  materialIds: [canvasId],
  colorIds: [whiteId],
  paletteIds: [brightId],
  collectionId: null,
  format: "single",
  partCount: null,
  saleStatus: "available",
  price: null,
  size: { width: 21.6, height: 27.9 },
  published: true,
  title: "Жираф",
  year: 2025,
  month: 4,
  country: null,
  city: "",
};

/** The If-Match of a client that read the work. */
async function readTag(id: string): Promise<string> {
  return (await getWork(id)).etag;
}

beforeEach(() => {
  vi.clearAllMocks();
  works.clear();
  sections.clear();
  sections.set(animalsId, { subsections: [{ id: birdsId, title: "Птицы" }], title: "Животные" });
  collections.clear();
  collections.set(animalsCollectionId, { title: "Звери" });
  lists.clear();
  lists.set("site/galleryMaterials", {
    materials: [
      { id: canvasId, title: "Холст" },
      { id: oilId, title: "Масло" },
    ],
  });
  lists.set("site/galleryPalettes", {
    palettes: [
      { id: pastelId, title: "Пастельная" },
      { id: brightId, title: "Яркая" },
    ],
  });
  lists.set("site/galleryColors", {
    colors: [
      { hex: "#ffffff", id: whiteId, title: "Белый" },
      { hex: "#1a1a1a", id: blackId, title: "Чёрный" },
    ],
  });
  works.set(elephantId, storedWork(elephantId, "Слон", 2023, 5));
  works.set(tigerId, storedWork(tigerId, "Тигр", 2024, 2));
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.publishUpload.mockImplementation(async (_uploadId: string, folder: string) =>
    publishedImage(folder),
  );
});

describe("listWorks", () => {
  it("lists the latest year first, with download URLs", async () => {
    const { data } = await listWorks();

    expect(data.map((work) => work.title)).toEqual(["Тигр", "Слон"]);
    expect(data[0]?.photo.sources.avif[0]?.url).toBe(
      `https://storage.test/galleryWorks/${tigerId}/photo/old-version/640.avif?token=token`,
    );
  });

  it("lists the works of one year by month, the latest first", async () => {
    works.set(newId, storedWork(newId, "Жираф", 2024, 7));

    const { data } = await listWorks();

    expect(data.map((work) => work.title)).toEqual(["Жираф", "Тигр", "Слон"]);
  });

  it("lists the works of one month by creation, the latest first", async () => {
    works.set(
      newId,
      storedWork(newId, "Жираф", 2024, 2, Timestamp.fromMillis(seededAt.toMillis() + 1)),
    );

    const { data } = await listWorks();

    expect(data.map((work) => work.title)).toEqual(["Жираф", "Тигр", "Слон"]);
  });
});

describe("the sections of a work", () => {
  it("leaves out a section deleted since the work was saved", async () => {
    const { data } = await getWork(elephantId);

    expect(data.sectionIds).toEqual([animalsId]);
    expect((await listWorks()).data[0]?.sectionIds).toEqual([animalsId]);
  });

  it("saves the sections and subsections named by id", async () => {
    const { data } = await replaceWork(
      elephantId,
      {
        ...body,
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
        sectionIds: [animalsId, birdsId],
      },
      await readTag(elephantId),
    );

    expect(data.sectionIds).toEqual([animalsId, birdsId]);
  });

  it("returns 422 for a section that does not exist, and removes the copies", async () => {
    await expect(
      createWork(newId, { ...body, sectionIds: [deletedSectionId] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
    await expect(
      replaceWork(
        elephantId,
        { ...body, sectionIds: [deletedSectionId] },
        await readTag(elephantId),
      ),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });
});

describe("the materials of a work", () => {
  it("leaves out a material deleted since the work was saved", async () => {
    const { data } = await getWork(elephantId);

    expect(data.materialIds).toEqual([oilId]);
    expect((await listWorks()).data[0]?.materialIds).toEqual([oilId]);
  });

  it("saves the materials named by id", async () => {
    const { data } = await replaceWork(
      elephantId,
      {
        ...body,
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
        materialIds: [oilId, canvasId],
      },
      await readTag(elephantId),
    );

    expect(data.materialIds).toEqual([oilId, canvasId]);
  });

  it("returns 422 for a material that does not exist, and removes the copies", async () => {
    await expect(
      createWork(newId, { ...body, materialIds: [deletedMaterialId] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
    await expect(
      replaceWork(
        elephantId,
        { ...body, materialIds: [deletedMaterialId] },
        await readTag(elephantId),
      ),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });

  it("knows no material before the materials are first saved", async () => {
    lists.delete("site/galleryMaterials");

    expect((await getWork(elephantId)).data.materialIds).toEqual([]);
    await expect(createWork(newId, body)).rejects.toBeInstanceOf(UnprocessableContentError);
  });
});

describe("the colors of a work", () => {
  it("leaves out a color deleted since the work was saved", async () => {
    const { data } = await getWork(elephantId);

    expect(data.colorIds).toEqual([blackId]);
    expect((await listWorks()).data[0]?.colorIds).toEqual([blackId]);
  });

  it("saves the colors named by id", async () => {
    const { data } = await replaceWork(
      elephantId,
      {
        ...body,
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
        colorIds: [blackId, whiteId],
      },
      await readTag(elephantId),
    );

    expect(data.colorIds).toEqual([blackId, whiteId]);
  });

  it("returns 422 for a color that does not exist, and removes the copies", async () => {
    await expect(createWork(newId, { ...body, colorIds: [deletedColorId] })).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
    await expect(
      replaceWork(elephantId, { ...body, colorIds: [deletedColorId] }, await readTag(elephantId)),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });
});

describe("the palettes of a work", () => {
  it("leaves out a palette deleted since the work was saved", async () => {
    const { data } = await getWork(elephantId);

    expect(data.paletteIds).toEqual([pastelId]);
    expect((await listWorks()).data[0]?.paletteIds).toEqual([pastelId]);
  });

  it("saves the palettes named by id", async () => {
    const { data } = await replaceWork(
      elephantId,
      {
        ...body,
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
        paletteIds: [pastelId, brightId],
      },
      await readTag(elephantId),
    );

    expect(data.paletteIds).toEqual([pastelId, brightId]);
  });

  it("returns 422 for a palette that does not exist, and removes the copies", async () => {
    await expect(
      createWork(newId, { ...body, paletteIds: [deletedPaletteId] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
    await expect(
      replaceWork(
        elephantId,
        { ...body, paletteIds: [deletedPaletteId] },
        await readTag(elephantId),
      ),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });
});

describe("the collection of a work", () => {
  it("returns null for a work on its own", async () => {
    expect((await getWork(elephantId)).data.collectionId).toBeNull();
  });

  it("saves the collection named by id", async () => {
    const created = await createWork(newId, { ...body, collectionId: animalsCollectionId });
    const replaced = await replaceWork(
      elephantId,
      {
        ...body,
        collectionId: animalsCollectionId,
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
      },
      await readTag(elephantId),
    );

    expect(created.data.collectionId).toBe(animalsCollectionId);
    expect(replaced.data.collectionId).toBe(animalsCollectionId);
  });

  it("makes a form opened before the work moved outdated", async () => {
    const etag = await readTag(elephantId);
    works.set(elephantId, { ...works.get(elephantId), collectionId: animalsCollectionId });

    await expect(replaceWork(elephantId, body, etag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
  });

  it("returns 422 for a collection that does not exist, and removes the copies", async () => {
    await expect(
      createWork(newId, { ...body, collectionId: deletedCollectionId }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
    await expect(
      replaceWork(
        elephantId,
        { ...body, collectionId: deletedCollectionId },
        await readTag(elephantId),
      ),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });

  describe("in a full collection", () => {
    beforeEach(() => {
      for (let index = 0; index < maxCollectionWorks; index++) {
        works.set(`member-${String(index)}`, { collectionId: animalsCollectionId });
      }
    });

    it("returns 409 for a work moved into it, and removes the copies", async () => {
      await expect(
        createWork(newId, { ...body, collectionId: animalsCollectionId }),
      ).rejects.toBeInstanceOf(ConflictError);
      await expect(
        replaceWork(
          elephantId,
          { ...body, collectionId: animalsCollectionId },
          await readTag(elephantId),
        ),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(works.has(newId)).toBe(false);
      expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
    });

    it("still saves a work already in it", async () => {
      works.set(elephantId, { ...works.get(elephantId), collectionId: animalsCollectionId });
      works.delete("member-0");

      await expect(
        replaceWork(
          elephantId,
          {
            ...body,
            collectionId: animalsCollectionId,
            processPhotos: [{ alt: "Набросок", id: processPhotoId }],
          },
          await readTag(elephantId),
        ),
      ).resolves.toMatchObject({ data: { collectionId: animalsCollectionId } });
    });
  });
});

describe("the format of a work", () => {
  it("reads a work saved before formats as a single work", async () => {
    const { data } = await getWork(elephantId);

    expect(data).toMatchObject({ format: "single", partCount: null });
  });

  it("saves a set with its count of works", async () => {
    const { data } = await createWork(newId, { ...body, format: "set", partCount: 12 });

    expect(data).toMatchObject({ format: "set", partCount: 12 });
    expect(works.get(newId)).toMatchObject({ format: "set", partCount: 12 });
  });
});

describe("the place of a work", () => {
  it("reads a work saved before places as a work without a country and a city", async () => {
    const { data } = await getWork(elephantId);

    expect(data).toMatchObject({ city: "", country: null });
  });

  it("saves the country and the city", async () => {
    const { data } = await createWork(newId, { ...body, city: "Варшава", country: "PL" });

    expect(data).toMatchObject({ city: "Варшава", country: "PL" });
    expect(works.get(newId)).toMatchObject({ city: "Варшава", country: "PL" });
  });
});

describe("whether the site shows a work", () => {
  it("reads a work saved before works could be hidden as shown", async () => {
    const { data } = await getWork(elephantId);

    expect(data.published).toBe(true);
  });

  it("saves a hidden work, and lists it for the admin", async () => {
    const { data } = await createWork(newId, { ...body, published: false });

    expect(data.published).toBe(false);
    expect(works.get(newId)?.published).toBe(false);
    expect((await listWorks()).data.map((work) => work.id)).toContain(newId);
  });
});

describe("the sale status of a work", () => {
  it("reads a work saved before sale statuses as a work for sale", async () => {
    const { data } = await getWork(elephantId);

    expect(data.saleStatus).toBe("available");
  });

  it("saves the sale status", async () => {
    const { data } = await createWork(newId, { ...body, saleStatus: "sold" });

    expect(data.saleStatus).toBe("sold");
    expect(works.get(newId)?.saleStatus).toBe("sold");
  });
});

describe("the price of a work", () => {
  it("reads a work saved before prices as a work without a price", async () => {
    const { data } = await getWork(elephantId);

    expect(data.price).toBeNull();
  });

  it("saves the price without the amount after the discount, which it computes", async () => {
    const price = { amount: 500, currency: "USD", discountPercent: 10 } as const;
    const { data } = await createWork(newId, { ...body, price });

    expect(data.price).toEqual({ ...price, finalAmount: 450 });
    expect(works.get(newId)?.price).toEqual(price);
  });

  it("gives the full amount as the final one when there is no discount", async () => {
    const price = { amount: 500, currency: "USD", discountPercent: null } as const;
    const { data } = await createWork(newId, { ...body, price });

    expect(data.price?.finalAmount).toBe(500);
  });

  it("rounds the amount after the discount to a whole dollar", async () => {
    const { data } = await createWork(newId, {
      ...body,
      price: { amount: 999, currency: "USD", discountPercent: 15 },
    });

    // 999 × 0.85 = 849.15
    expect(data.price?.finalAmount).toBe(849);
  });

  it("changes the entity tag when only the price changes", async () => {
    const withoutPrice = { ...body, photo: { alt: "Слон" } };
    const { etag } = await replaceWork(elephantId, withoutPrice, await readTag(elephantId));
    const { etag: priced } = await replaceWork(
      elephantId,
      { ...withoutPrice, price: { amount: 500, currency: "USD", discountPercent: null } },
      etag,
    );

    expect(priced).not.toBe(etag);
  });
});

describe("getWork", () => {
  it("returns the work with its id", async () => {
    const { data, id } = await getWork(elephantId);

    expect(id).toBe(elephantId);
    expect(data).toMatchObject({ id: elephantId, title: "Слон", year: 2023 });
  });

  it("returns the size in inches as well, rounded to hundredths", async () => {
    works.set(elephantId, {
      ...storedWork(elephantId, "Слон", 2023, 5),
      size: { width: 21.6, height: 27.9 },
    });

    const { data } = await getWork(elephantId);

    expect(data.size).toEqual({ width: 21.6, height: 27.9 });
    expect(data.sizeInches).toEqual({ width: 8.5, height: 10.98 });
  });

  it("gives back the inches a size was measured in", async () => {
    // 16 × 20 inches and 11.75 × 15.13 inches, saved in centimetres with two decimals.
    works.set(elephantId, {
      ...storedWork(elephantId, "Слон", 2023, 5),
      size: { width: 40.64, height: 50.8 },
    });
    works.set(tigerId, {
      ...storedWork(tigerId, "Тигр", 2023, 5),
      size: { width: 29.85, height: 38.43 },
    });

    expect((await getWork(elephantId)).data.sizeInches).toEqual({ width: 16, height: 20 });
    expect((await getWork(tigerId)).data.sizeInches).toEqual({ width: 11.75, height: 15.13 });
  });

  it("returns 404 for a work that does not exist", async () => {
    await expect(getWork(newId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createWork", () => {
  it("creates the work with its photo copied into its own folder", async () => {
    const { data, etag } = await createWork(newId, body);

    expect(uploads.publishUpload).toHaveBeenCalledWith(uploadId, `galleryWorks/${newId}/photo`);
    expect(data).toMatchObject({
      description: body.description,
      photo: { alt: "Новое фото", version: "new-version" },
      size: body.size,
      title: "Жираф",
      year: 2025,
    });
    expect(works.get(newId)?.photo).not.toHaveProperty("uploadId");
    expect(etag).toBe(await readTag(newId));
    // The upload stays for a save repeated after a lost response.
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("dates the new work by the server clock", async () => {
    const { data } = await createWork(newId, body);

    expect(data.createdAt).toBe(data.updatedAt);
    expect(Date.parse(data.createdAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("copies the process photos into their own folders", async () => {
    const { data } = await createWork(newId, {
      ...body,
      processPhotos: [{ alt: "Набросок", uploadId: processUploadId }],
    });

    expect(data.processPhotos).toEqual([
      expect.objectContaining({ alt: "Набросок", version: "new-version" }),
    ]);
    expect(uploads.publishUpload).toHaveBeenCalledWith(
      processUploadId,
      `galleryWorks/${newId}/process/${String(data.processPhotos[0]?.id)}`,
    );
  });

  it("returns 422 for a process photo id, which no new work has, and removes the copies", async () => {
    await expect(
      createWork(newId, { ...body, processPhotos: [{ alt: "Набросок", id: processPhotoId }] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(works.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${newId}/photo/new-version`);
  });

  it("returns 422 for a photo without an upload, which no new work has", async () => {
    await expect(createWork(newId, { ...body, photo: { alt: "Фото" } })).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );

    expect(works.has(newId)).toBe(false);
    expect(uploads.publishUpload).not.toHaveBeenCalled();
  });

  it("returns 412 for an id a work already has, such as an earlier try, and removes the copy", async () => {
    const saved = works.get(elephantId);

    await expect(createWork(elephantId, body)).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(works.get(elephantId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryWorks/${elephantId}/photo/new-version`,
    );
  });
});

describe("replaceWork", () => {
  it("replaces the fields and keeps the saved photo file when there is no upload", async () => {
    const { data } = await replaceWork(
      elephantId,
      {
        ...body,
        photo: { alt: "Другой alt" },
        processPhotos: [{ alt: "Набросок", id: processPhotoId }],
      },
      await readTag(elephantId),
    );

    expect(uploads.publishUpload).not.toHaveBeenCalled();
    expect(data).toMatchObject({
      photo: { alt: "Другой alt", version: "old-version" },
      title: "Жираф",
      year: 2025,
    });
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("replaces the photo file and then removes the old version", async () => {
    const { data } = await replaceWork(elephantId, body, await readTag(elephantId));

    expect(data.photo).toMatchObject({ alt: "Новое фото", version: "new-version" });
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryWorks/${elephantId}/photo/old-version`,
    );
  });

  it("keeps the process photos named by id and deletes those left out", async () => {
    const kept = await replaceWork(
      elephantId,
      { ...body, processPhotos: [{ alt: "Новый alt", id: processPhotoId }] },
      await readTag(elephantId),
    );

    expect(kept.data.processPhotos).toEqual([
      expect.objectContaining({ alt: "Новый alt", id: processPhotoId, version: "old-version" }),
    ]);
    expect(storage.deleteFolder).not.toHaveBeenCalledWith(
      expect.stringContaining(`/process/${processPhotoId}`),
    );

    await replaceWork(elephantId, body, kept.etag);

    expect(works.get(elephantId)?.processPhotos).toEqual([]);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryWorks/${elephantId}/process/${processPhotoId}`,
    );
  });

  it("keeps when the work was created and dates the change", async () => {
    const { data } = await replaceWork(elephantId, body, await readTag(elephantId));

    expect(data.createdAt).toBe(seededAt.toDate().toISOString());
    expect(Date.parse(data.updatedAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("returns 412 for a work changed since it was read, and removes the copy", async () => {
    const saved = works.get(elephantId);

    await expect(replaceWork(elephantId, body, '"stale"')).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );

    expect(works.get(elephantId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryWorks/${elephantId}/photo/new-version`,
    );
  });

  it("returns 404 for a work that does not exist", async () => {
    await expect(replaceWork(newId, body, '"any"')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("deleteWork", () => {
  it("deletes the work and then its folder", async () => {
    await deleteWork(elephantId, await readTag(elephantId));

    expect(works.has(elephantId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryWorks/${elephantId}`);
  });

  it("returns 412 for a work changed since it was read", async () => {
    await expect(deleteWork(elephantId, '"stale"')).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(works.has(elephantId)).toBe(true);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });
});
