import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `galleryWorks` collection: documents by id. Transactions write to it at once. */
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
  function snapshot(id: string) {
    const data = works.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  function document(id: string) {
    return { get: async () => snapshot(id), id };
  }

  const transaction = {
    create: (ref: { id: string }, data: Record<string, unknown>) => works.set(ref.id, data),
    delete: (ref: { id: string }) => works.delete(ref.id),
    get: (target: { get: () => unknown }) => target.get(),
    set: (ref: { id: string }, data: Record<string, unknown>) => works.set(ref.id, data),
  };

  return {
    firestore: () => ({
      collection: () => ({
        doc: document,
        get: async () => ({ docs: [...works.keys()].map(snapshot) }),
      }),
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

import type { WorkBody } from "#modules/gallery-works/schema";
import {
  createWork,
  deleteWork,
  getWork,
  listWorks,
  replaceWork,
} from "#modules/gallery-works/service";
import {
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";

const elephantId = "11111111-1111-4111-8111-111111111111";
const tigerId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";
const newId = "55555555-5555-4555-8555-555555555555";

function storedPhoto(workId: string) {
  const folder = `galleryWorks/${workId}/photo/old-version`;

  return {
    alt: "Старое фото",
    fileName: "old.png",
    fileSize: 100,
    height: 320,
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

function storedWork(id: string, title: string, year: number, createdAt = seededAt) {
  return {
    createdAt,
    description: "",
    photo: storedPhoto(id),
    size: { width: 50, height: 70, unit: "cm" },
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
  size: { width: 8.5, height: 11, unit: "in" },
  title: "Жираф",
  year: 2025,
};

/** The If-Match of a client that read the work. */
async function readTag(id: string): Promise<string> {
  return (await getWork(id)).etag;
}

beforeEach(() => {
  vi.clearAllMocks();
  works.clear();
  works.set(elephantId, storedWork(elephantId, "Слон", 2023));
  works.set(tigerId, storedWork(tigerId, "Тигр", 2024));
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

  it("lists the works of one year by creation, the latest first", async () => {
    works.set(
      newId,
      storedWork(newId, "Жираф", 2024, Timestamp.fromMillis(seededAt.toMillis() + 1)),
    );

    const { data } = await listWorks();

    expect(data.map((work) => work.title)).toEqual(["Жираф", "Тигр", "Слон"]);
  });
});

describe("getWork", () => {
  it("returns the work with its id", async () => {
    const { data, id } = await getWork(elephantId);

    expect(id).toBe(elephantId);
    expect(data).toMatchObject({ id: elephantId, title: "Слон", year: 2023 });
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
      { ...body, photo: { alt: "Другой alt" } },
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
