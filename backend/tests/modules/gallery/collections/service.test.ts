import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `galleryCollections` collection: documents by id. Transactions write to it at once. */
const collections = vi.hoisted(() => new Map<string, Record<string, unknown>>());

/** The `galleryWorks` collection, whose works name the collection they are in. */
const works = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const uploads = vi.hoisted(() => ({
  publishUpload: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => {
  type Documents = Map<string, Record<string, unknown>>;

  interface Reference {
    documents: Documents;
    id: string;
  }

  function snapshot({ documents, id }: Reference) {
    const data = documents.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  function reference(documents: Documents, id: string) {
    return { documents, get: async () => snapshot({ documents, id }), id };
  }

  function all(documents: Documents) {
    return [...documents.keys()].map((id) => snapshot({ documents, id }));
  }

  function collectionNamed(name: string) {
    const documents = name === "galleryWorks" ? works : collections;

    return {
      doc: (id: string) => reference(documents, id),
      get: async () => ({ docs: all(documents) }),
      where: (field: string, _operator: "==", value: unknown) => ({
        get: async () => ({
          docs: all(documents).filter((document) => document.data()?.[field] === value),
        }),
      }),
    };
  }

  const transaction = {
    create: ({ documents, id }: Reference, data: Record<string, unknown>) =>
      documents.set(id, data),
    delete: ({ documents, id }: Reference) => documents.delete(id),
    get: (target: { get: () => unknown }) => target.get(),
    getAll: async (...references: Reference[]) => references.map(snapshot),
    set: ({ documents, id }: Reference, data: Record<string, unknown>) => documents.set(id, data),
    update: ({ documents, id }: Reference, data: Record<string, unknown>) =>
      documents.set(id, { ...documents.get(id), ...data }),
  };

  return {
    firestore: () => ({
      collection: collectionNamed,
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

import type { CollectionBody } from "#modules/gallery/collections/schema";
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  replaceCollection,
} from "#modules/gallery/collections/service";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const animalsId = "11111111-1111-4111-8111-111111111111";
const seaId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";
const newId = "55555555-5555-4555-8555-555555555555";
const elephantId = "66666666-6666-4666-8666-666666666666";
const tigerId = "77777777-7777-4777-8777-777777777777";
const whaleId = "88888888-8888-4888-8888-888888888888";
const foxId = "99999999-9999-4999-8999-999999999999";
const deletedWorkId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function storedCover(collectionId: string) {
  const folder = `galleryCollections/${collectionId}/cover/old-version`;

  return {
    alt: "Старая обложка",
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

/** When the seeded collections were made and last saved. */
const seededAt = Timestamp.fromDate(new Date("2026-01-15T10:00:00.000Z"));

function storedCollection(
  id: string,
  title: string,
  startYear: number,
  endYear: number | null = null,
) {
  return {
    cover: storedCover(id),
    createdAt: seededAt,
    description: "Серия.",
    endYear,
    startYear,
    title,
    updatedAt: seededAt,
  };
}

/** A saved work, dated by its month, in the collection `collectionId` or on its own. */
function storedWork(year: number, month: number, collectionId: string | null) {
  return {
    collectionId,
    colorIds: [],
    createdAt: seededAt,
    translations: {},
    description: "Масло.",
    materialIds: [],
    month,
    paletteIds: [],
    published: true,
    country: null,
    city: "",
    format: "single",
    partCount: null,
    saleStatus: "available",
    price: null,
    photo: storedCover("work"),
    processPhotos: [],
    sectionIds: [],
    size: { height: 70, width: 50 },
    title: "Работа",
    updatedAt: seededAt,
    year,
  };
}

/** The collection a saved work is in. */
function collectionOf(workId: string): unknown {
  return works.get(workId)?.collectionId;
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

const body: CollectionBody = {
  cover: { alt: "Новая обложка", uploadId },
  description: "Серия о лесе.",
  endYear: 2025,
  startYear: 2024,
  title: "Лес",
  workIds: [],
};

/** The If-Match of a client that read the collection. */
async function readTag(id: string): Promise<string> {
  return (await getCollection(id, "admin")).etag;
}

beforeEach(() => {
  vi.clearAllMocks();
  collections.clear();
  collections.set(animalsId, storedCollection(animalsId, "Звери", 2022, 2023));
  collections.set(seaId, storedCollection(seaId, "Море", 2024));
  works.clear();
  works.set(elephantId, storedWork(2023, 5, animalsId));
  works.set(tigerId, storedWork(2024, 2, animalsId));
  works.set(whaleId, storedWork(2024, 6, seaId));
  works.set(foxId, storedWork(2022, 1, null));
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.publishUpload.mockImplementation(async (_uploadId: string, folder: string) =>
    publishedImage(folder),
  );
});

describe("listCollections", () => {
  it("lists the latest first, with download URLs", async () => {
    const { data } = await listCollections("admin");

    expect(data.map((collection) => collection.title)).toEqual(["Море", "Звери"]);
    expect(data[0]?.cover.sources.avif[0]?.url).toBe(
      `https://storage.test/galleryCollections/${seaId}/cover/old-version/640.avif?token=token`,
    );
  });

  it("lists by the year a collection was finished, then by its start", async () => {
    collections.set(newId, storedCollection(newId, "Лес", 2020, 2024));

    const { data } = await listCollections("admin");

    expect(data.map((collection) => collection.title)).toEqual(["Море", "Лес", "Звери"]);
  });

  it("lists the collections of the same years by title", async () => {
    collections.set(newId, storedCollection(newId, "Горы", 2024));

    const { data } = await listCollections("admin");

    expect(data.map((collection) => collection.title)).toEqual(["Горы", "Море", "Звери"]);
  });
});

describe("the works of a collection", () => {
  it("returns the works of each collection, the latest first", async () => {
    works.set(foxId, storedWork(2022, 1, seaId));

    const { data } = await listCollections("admin");

    expect(data.map((collection) => collection.workIds)).toEqual([
      [whaleId, foxId],
      [tigerId, elephantId],
    ]);
    expect((await getCollection(animalsId, "admin")).data.workIds).toEqual([tigerId, elephantId]);
  });

  it("returns a hidden work to the admin and not to a visitor", async () => {
    works.set(tigerId, { ...storedWork(2024, 2, animalsId), published: false });

    expect((await getCollection(animalsId, "admin")).data.workIds).toEqual([tigerId, elephantId]);
    expect((await getCollection(animalsId, "visitor")).data.workIds).toEqual([elephantId]);
    expect((await listCollections("visitor")).data.map((collection) => collection.workIds)).toEqual(
      [[whaleId], [elephantId]],
    );
  });

  it("returns no works for an empty collection", async () => {
    works.clear();

    expect((await getCollection(animalsId, "admin")).data.workIds).toEqual([]);
    expect((await listCollections("admin")).data.map((collection) => collection.workIds)).toEqual([
      [],
      [],
    ]);
  });

  it("creates a collection with its works", async () => {
    works.set(whaleId, storedWork(2024, 1, null));

    const { data } = await createCollection(newId, { ...body, workIds: [foxId, whaleId] });

    expect(data.workIds).toEqual([whaleId, foxId]);
    expect(collectionOf(foxId)).toBe(newId);
    expect(collectionOf(whaleId)).toBe(newId);
  });

  it("returns 422 for a work of another collection, and moves nothing", async () => {
    await expect(
      createCollection(newId, { ...body, workIds: [foxId, whaleId] }),
    ).rejects.toMatchObject({ status: 422 });

    expect(collectionOf(foxId)).toBeNull();
    expect(collectionOf(whaleId)).toBe(seaId);
  });

  it("refuses a work put in another collection after the form was opened", async () => {
    const { data, etag } = await getCollection(animalsId, "admin");

    works.set(foxId, storedWork(2024, 1, seaId));

    await expect(
      replaceCollection(animalsId, { ...body, workIds: [...data.workIds, foxId] }, etag),
    ).rejects.toMatchObject({ status: 422 });

    expect(collectionOf(foxId)).toBe(seaId);
  });

  it("adds and removes works, leaving a removed work on its own", async () => {
    const { data } = await replaceCollection(
      animalsId,
      { ...body, workIds: [foxId, tigerId] },
      await readTag(animalsId),
    );

    expect(data.workIds).toEqual([tigerId, foxId]);
    expect(collectionOf(foxId)).toBe(animalsId);
    expect(collectionOf(elephantId)).toBeNull();
    expect(collectionOf(whaleId)).toBe(seaId);
    // Moving a work does not edit it.
    expect(works.get(foxId)?.updatedAt).toBe(seededAt);
  });

  it("changes the tag with the date of every save, even of the same values", async () => {
    const before = await readTag(animalsId);
    const { data, etag } = await replaceCollection(animalsId, body, before);
    // A later save, a millisecond on at least.
    vi.useFakeTimers({ now: Date.now() + 1, toFake: ["Date"] });
    const { etag: again } = await replaceCollection(animalsId, body, etag);
    vi.useRealTimers();

    expect(etag).toBe(entityTag(data));
    expect(again).not.toBe(etag);
  });

  it("returns the tag a later read gives", async () => {
    const { etag } = await replaceCollection(
      animalsId,
      { ...body, workIds: [foxId] },
      await readTag(animalsId),
    );

    expect(etag).toBe(await readTag(animalsId));
  });

  it("makes a page opened before a work moved in outdated", async () => {
    const etag = await readTag(animalsId);
    works.set(foxId, storedWork(2022, 1, animalsId));

    await expect(replaceCollection(animalsId, body, etag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
  });

  it("returns 422 for a work that does not exist, and moves nothing", async () => {
    await expect(
      createCollection(newId, { ...body, workIds: [foxId, deletedWorkId] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);
    await expect(
      replaceCollection(animalsId, { ...body, workIds: [deletedWorkId] }, await readTag(animalsId)),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(collections.has(newId)).toBe(false);
    expect(collectionOf(foxId)).toBeNull();
    expect(collectionOf(elephantId)).toBe(animalsId);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${newId}/cover/new-version`,
    );
  });

  it("leaves the works of a deleted collection on their own", async () => {
    await deleteCollection(animalsId, await readTag(animalsId));

    expect(collectionOf(elephantId)).toBeNull();
    expect(collectionOf(tigerId)).toBeNull();
    expect(collectionOf(whaleId)).toBe(seaId);
  });
});

describe("getCollection", () => {
  it("returns the collection with its id", async () => {
    const { data } = await getCollection(animalsId, "admin");

    expect(data).toMatchObject({ endYear: 2023, id: animalsId, startYear: 2022, title: "Звери" });
  });

  it("returns 404 for a collection that does not exist", async () => {
    await expect(getCollection(newId, "admin")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("createCollection", () => {
  it("creates the collection with its cover copied into its own folder", async () => {
    const { data, etag } = await createCollection(newId, body);

    expect(uploads.publishUpload).toHaveBeenCalledWith(
      uploadId,
      `galleryCollections/${newId}/cover`,
    );
    expect(data).toMatchObject({
      cover: { alt: "Новая обложка", version: "new-version" },
      description: body.description,
      endYear: 2025,
      startYear: 2024,
      title: "Лес",
    });
    expect(collections.get(newId)?.cover).not.toHaveProperty("uploadId");
    expect(etag).toBe(await readTag(newId));
    // The upload stays for a save repeated after a lost response.
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("dates the new collection by the server clock", async () => {
    const { data } = await createCollection(newId, body);

    expect(data.createdAt).toBe(data.updatedAt);
    expect(Date.parse(data.createdAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("returns 422 for a cover without an upload, which no new collection has", async () => {
    await expect(
      createCollection(newId, { ...body, cover: { alt: "Обложка" } }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(collections.has(newId)).toBe(false);
    expect(uploads.publishUpload).not.toHaveBeenCalled();
  });

  it("returns 409 for a title another collection has, whatever the case, and removes the copy", async () => {
    await expect(createCollection(newId, { ...body, title: "звери" })).rejects.toBeInstanceOf(
      ConflictError,
    );

    expect(collections.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${newId}/cover/new-version`,
    );
  });

  it("returns 412 for an id a collection already has, such as an earlier try, and removes the copy", async () => {
    const saved = collections.get(animalsId);

    await expect(createCollection(animalsId, body)).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(collections.get(animalsId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${animalsId}/cover/new-version`,
    );
  });
});

describe("replaceCollection", () => {
  it("replaces the fields and keeps the saved cover file when there is no upload", async () => {
    const { data } = await replaceCollection(
      animalsId,
      { ...body, cover: { alt: "Другой alt" }, endYear: null },
      await readTag(animalsId),
    );

    expect(uploads.publishUpload).not.toHaveBeenCalled();
    expect(data).toMatchObject({
      cover: { alt: "Другой alt", version: "old-version" },
      endYear: null,
      startYear: 2024,
      title: "Лес",
    });
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("replaces the cover file and then removes the old version", async () => {
    const { data } = await replaceCollection(animalsId, body, await readTag(animalsId));

    expect(data.cover).toMatchObject({ alt: "Новая обложка", version: "new-version" });
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${animalsId}/cover/old-version`,
    );
  });

  it("keeps its own title in another case", async () => {
    const { data } = await replaceCollection(
      animalsId,
      { ...body, title: "ЗВЕРИ" },
      await readTag(animalsId),
    );

    expect(data.title).toBe("ЗВЕРИ");
  });

  it("returns 409 for a title another collection has, and removes the copy", async () => {
    const saved = collections.get(animalsId);

    await expect(
      replaceCollection(animalsId, { ...body, title: "Море" }, await readTag(animalsId)),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(collections.get(animalsId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${animalsId}/cover/new-version`,
    );
  });

  it("keeps when the collection was created and dates the change", async () => {
    const { data } = await replaceCollection(animalsId, body, await readTag(animalsId));

    expect(data.createdAt).toBe(seededAt.toDate().toISOString());
    expect(Date.parse(data.updatedAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("returns 412 for a collection changed since it was read, and removes the copy", async () => {
    const saved = collections.get(animalsId);

    await expect(replaceCollection(animalsId, body, '"stale"')).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );

    expect(collections.get(animalsId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `galleryCollections/${animalsId}/cover/new-version`,
    );
  });

  it("returns 404 for a collection that does not exist", async () => {
    await expect(replaceCollection(newId, body, '"any"')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("deleteCollection", () => {
  it("deletes the collection and then its folder", async () => {
    await deleteCollection(animalsId, await readTag(animalsId));

    expect(collections.has(animalsId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`galleryCollections/${animalsId}`);
  });

  it("returns 412 for a collection changed since it was read", async () => {
    await expect(deleteCollection(animalsId, '"stale"')).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );

    expect(collections.has(animalsId)).toBe(true);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });
});
