import { beforeEach, describe, expect, it, vi } from "vitest";

/** The `projects` collection: documents by id. Transactions write to it at once. */
const projects = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const uploads = vi.hoisted(() => ({
  publishUpload: vi.fn(),
}));

vi.mock("#shared/i18n/translation-store", () => ({
  deleteTranslations: vi.fn(),
  requestTranslations: vi.fn(),
}));
vi.mock("#shared/firebase/firestore", () => {
  function snapshot(id: string) {
    const data = projects.get(id);

    return { data: () => data, exists: data !== undefined, id };
  }

  function query(limit = Number.POSITIVE_INFINITY) {
    return {
      get: async () => ({
        docs: [...projects]
          .sort(([, a], [, b]) => Number(a.position) - Number(b.position))
          .slice(0, limit)
          .map(([id]) => snapshot(id)),
      }),
      limit: (count: number) => query(count),
      select: () => query(limit),
    };
  }

  function document(id: string) {
    return { get: async () => snapshot(id), id };
  }

  const transaction = {
    create: (ref: { id: string }, data: Record<string, unknown>) => projects.set(ref.id, data),
    delete: (ref: { id: string }) => projects.delete(ref.id),
    get: (target: { get: () => unknown }) => target.get(),
    set: (ref: { id: string }, data: Record<string, unknown>) => projects.set(ref.id, data),
    update: (ref: { id: string }, fields: Record<string, unknown>) =>
      projects.set(ref.id, { ...projects.get(ref.id), ...fields }),
  };

  return {
    firestore: () => ({
      collection: () => ({ doc: document, orderBy: () => query() }),
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

import {
  createProject,
  deleteProject,
  getProject,
  getProjectsOrder,
  listProjects,
  replaceProject,
  replaceProjectsOrder,
} from "#modules/projects/service";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const elephantId = "11111111-1111-4111-8111-111111111111";
const tigerId = "22222222-2222-4222-8222-222222222222";
const photoId = "33333333-3333-4333-8333-333333333333";
const uploadId = "44444444-4444-4444-8444-444444444444";
const newId = "55555555-5555-4555-8555-555555555555";

function storedPhoto(projectId: string) {
  const folder = `projects/${projectId}/photos/${photoId}/old-version`;

  return {
    alt: "Обложка",
    fileName: "old.png",
    fileSize: 100,
    height: 320,
    id: photoId,
    originalPath: `${folder}/original.png`,
    sources: {
      avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
      webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
    },
    version: "old-version",
    width: 640,
  };
}

/** When the seeded projects were made and last saved. */
const seededAt = Timestamp.fromDate(new Date("2026-01-15T10:00:00.000Z"));

function storedProject(id: string, title: string, position: number) {
  return {
    createdAt: seededAt,
    description: "",
    link: "",
    photos: [storedPhoto(id)],
    position,
    title,
    updatedAt: seededAt,
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

/** The If-Match of a client that read the project. */
async function readTag(id: string): Promise<string> {
  return (await getProject(id)).etag;
}

const body = {
  description: "Иллюстрации к книге.",
  link: "https://elephant.com",
  photos: [{ alt: "Новое фото", uploadId }],
  title: "Слон",
};

beforeEach(() => {
  vi.clearAllMocks();
  projects.clear();
  projects.set(elephantId, storedProject(elephantId, "Слон", 0));
  projects.set(tigerId, storedProject(tigerId, "Тигр", 1));
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.publishUpload.mockImplementation(async (_uploadId: string, folder: string) =>
    publishedImage(folder),
  );
});

describe("listProjects", () => {
  it("lists the projects by position, with download URLs", async () => {
    projects.set(elephantId, storedProject(elephantId, "Слон", 5));

    const { data } = await listProjects();

    expect(data.map((project) => project.title)).toEqual(["Тигр", "Слон"]);
    expect(data[0]?.photos[0]?.sources.avif[0]?.url).toBe(
      `https://storage.test/projects/${tigerId}/photos/${photoId}/old-version/640.avif?token=token`,
    );
    expect(data[0]).not.toHaveProperty("position");
  });

  it("lists nothing before the first project", async () => {
    projects.clear();

    await expect(listProjects()).resolves.toEqual({ data: [], etag: entityTag([]) });
  });
});

describe("getProject", () => {
  it("returns the project with its id", async () => {
    const { data } = await getProject(elephantId);

    expect(data).toMatchObject({ id: elephantId, title: "Слон" });
  });

  it("returns 404 for a project that does not exist", async () => {
    await expect(getProject(photoId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("changes the tag with the date of every save, even of the same values", async () => {
    const { data, etag } = await replaceProject(elephantId, body, await readTag(elephantId));
    // A later save, a millisecond on at least.
    vi.useFakeTimers({ now: Date.now() + 1, toFake: ["Date"] });
    const { etag: again } = await replaceProject(elephantId, body, etag);
    vi.useRealTimers();

    expect(etag).toBe(entityTag(data));
    expect(again).not.toBe(etag);
  });

  it("keeps the tag when only the position changes", async () => {
    const before = await readTag(elephantId);

    await replaceProjectsOrder([tigerId, elephantId], (await getProjectsOrder()).etag);

    await expect(readTag(elephantId)).resolves.toBe(before);
  });
});

describe("createProject", () => {
  const newProject = { ...body, title: "Жираф" };

  it("puts the new project at the top of the list, with its photos in its own folder", async () => {
    const { data, etag } = await createProject(newId, newProject);

    expect((await getProjectsOrder()).data).toEqual([newId, elephantId, tigerId]);
    expect(uploads.publishUpload).toHaveBeenCalledWith(
      uploadId,
      `projects/${newId}/photos/${String(data.photos[0]?.id)}`,
    );
    expect(data).toMatchObject({ description: body.description, link: body.link, title: "Жираф" });
    expect(etag).toBe(await readTag(newId));
    // The upload stays for a save repeated after a lost response.
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("dates the new project by the server clock", async () => {
    const { data } = await createProject(newId, newProject);

    expect(data.createdAt).toBe(data.updatedAt);
    expect(Date.parse(data.createdAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("creates the first project at position 0", async () => {
    projects.clear();

    await createProject(newId, newProject);

    expect(projects.get(newId)?.position).toBe(0);
  });

  it("returns 412 for an id a project already has, such as an earlier try, and removes the copies", async () => {
    const saved = projects.get(elephantId);

    await expect(createProject(elephantId, body)).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(projects.get(elephantId)).toBe(saved);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^projects/${elephantId}/photos/.+/new-version$`)),
    );
  });

  it("returns 422 for a photo id, which no new project has, and removes the copies", async () => {
    await expect(
      createProject(newId, { ...newProject, photos: [{ alt: "Старое", id: photoId, uploadId }] }),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(projects.size).toBe(2);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^projects/${newId}/photos/.+/new-version$`)),
    );
  });

  it("returns 409 for a title another project has, in any case, and removes the copies", async () => {
    await expect(createProject(newId, { ...newProject, title: "тигр" })).rejects.toBeInstanceOf(
      ConflictError,
    );

    expect(projects.has(newId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^projects/${newId}/photos/.+/new-version$`)),
    );
  });
});

describe("replaceProject", () => {
  it("replaces the fields and the photos, and keeps the place in the list", async () => {
    const { data } = await replaceProject(elephantId, body, await readTag(elephantId));

    expect(data).toMatchObject({ link: body.link, title: "Слон" });
    expect(data.photos.map((photo) => photo.alt)).toEqual(["Новое фото"]);
    expect(projects.get(elephantId)?.position).toBe(0);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`projects/${elephantId}/photos/${photoId}`);
  });

  it("keeps its own title, in another case too", async () => {
    const { data } = await replaceProject(
      elephantId,
      { ...body, title: "СЛОН" },
      await readTag(elephantId),
    );

    expect(data.title).toBe("СЛОН");
  });

  it("returns 409 for a title another project has, and keeps the project", async () => {
    const saved = projects.get(elephantId);

    await expect(
      replaceProject(elephantId, { ...body, title: "Тигр" }, await readTag(elephantId)),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(projects.get(elephantId)).toBe(saved);
  });

  it("keeps the creation date and moves the update date", async () => {
    const { data } = await replaceProject(elephantId, body, await readTag(elephantId));

    expect(data.createdAt).toBe(seededAt.toDate().toISOString());
    expect(Date.parse(data.updatedAt)).toBeGreaterThan(seededAt.toMillis());
  });

  it("keeps a saved photo by id and changes its alt text", async () => {
    const { data } = await replaceProject(
      elephantId,
      { ...body, photos: [{ alt: "Новый alt", id: photoId }] },
      await readTag(elephantId),
    );

    expect(data.photos).toMatchObject([{ alt: "Новый alt", id: photoId, version: "old-version" }]);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("returns 412 when the project has changed since it was read, and removes the copies", async () => {
    const tag = await readTag(elephantId);
    await replaceProject(elephantId, { ...body, photos: [] }, tag);
    storage.deleteFolder.mockClear();

    await expect(replaceProject(elephantId, body, tag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(projects.get(elephantId)?.photos).toEqual([]);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^projects/${elephantId}/photos/.+/new-version$`)),
    );
  });

  it("returns 404 for a project that does not exist", async () => {
    await expect(replaceProject(photoId, body, "*")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("deleteProject", () => {
  it("deletes the project and all its files", async () => {
    await deleteProject(elephantId, await readTag(elephantId));

    expect(projects.has(elephantId)).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`projects/${elephantId}`);
  });

  it("returns 412 for a project changed since it was read", async () => {
    await expect(deleteProject(elephantId, '"outdated"')).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(projects.has(elephantId)).toBe(true);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("returns 404 for a project that does not exist", async () => {
    await expect(deleteProject(photoId, "*")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("projects order", () => {
  it("returns the ids by position, tagged by them", async () => {
    await expect(getProjectsOrder()).resolves.toEqual({
      data: [elephantId, tigerId],
      etag: entityTag([elephantId, tigerId]),
    });
  });

  it("puts the projects in the given order", async () => {
    const order = await replaceProjectsOrder(
      [tigerId, elephantId],
      entityTag([elephantId, tigerId]),
    );

    expect(order).toEqual({ data: [tigerId, elephantId], etag: entityTag([tigerId, elephantId]) });
    expect((await getProjectsOrder()).data).toEqual([tigerId, elephantId]);
    // Moving a project is not editing it.
    expect((await getProject(elephantId)).data.updatedAt).toBe(seededAt.toDate().toISOString());
  });

  it("returns 412 when the order has changed since it was read", async () => {
    await expect(
      replaceProjectsOrder([tigerId, elephantId], entityTag([tigerId, elephantId])),
    ).rejects.toBeInstanceOf(PreconditionFailedError);
  });

  it("returns 422 unless the ids name every project", async () => {
    const tag = entityTag([elephantId, tigerId]);

    await expect(replaceProjectsOrder([tigerId], tag)).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
    await expect(replaceProjectsOrder([tigerId, photoId], tag)).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
    expect((await getProjectsOrder()).data).toEqual([elephantId, tigerId]);
  });
});
