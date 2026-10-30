import { beforeEach, describe, expect, it, vi } from "vitest";

/** The stored hero of each page document, by document path. */
const storedHeroes = vi.hoisted(() => new Map<string, unknown>());

/** A page document; `get` reads its stored hero. */
const FakeDocument = vi.hoisted(
  () =>
    class FakeDocument {
      readonly id: string;

      constructor(readonly path: string) {
        this.id = path.slice(path.lastIndexOf("/") + 1);
      }

      get() {
        return Promise.resolve({
          get: (field: string) => (field === "hero" ? storedHeroes.get(this.path) : undefined),
          id: this.id,
        });
      }
    },
);

type FakeDocument = InstanceType<typeof FakeDocument>;

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));

const database = vi.hoisted(() => ({
  doc: (path: string) => new FakeDocument(path),
  getAll: vi.fn(),
  runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
}));

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const uploads = vi.hoisted(() => ({
  deleteUploadsOrWarn: vi.fn(),
  publishUpload: vi.fn(),
}));

vi.mock("#shared/firebase/firestore", () => ({ firestore: () => database }));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...uploads,
}));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { deletePageHero, getPageHero, getPages, savePageHero } from "#modules/pages/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const uploadId = "11111111-1111-4111-8111-111111111111";

/** The image publishUpload copies from the upload into a new version folder. */
const published = {
  fileName: "painting.jpg",
  fileSize: 8,
  height: 320,
  sources: {
    avif: [{ path: "pages/about/hero/new/640.avif", token: "token", width: 640 }],
    webp: [{ path: "pages/about/hero/new/640.webp", token: "token", width: 640 }],
  },
  version: "new",
  width: 640,
};

const aboutDocument = database.doc("pages/about");

const storedHero = {
  fileName: "old.jpg",
  fileSize: 100,
  height: 540,
  sources: {
    avif: [{ path: "pages/about/hero/old/960.avif", token: "avif-token", width: 960 }],
    webp: [{ path: "pages/about/hero/old/960.webp", token: "webp-token", width: 960 }],
  },
  version: "old",
  width: 960,
};

/** The tags of a page without a hero and of a page with `storedHero`, as a client read them. */
const emptyTag = entityTag(null);
const storedTag = entityTag(storedHero);

beforeEach(() => {
  vi.resetAllMocks();
  storedHeroes.clear();
  database.getAll.mockImplementation((...documents: FakeDocument[]) =>
    Promise.all(documents.map((document) => document.get())),
  );
  transaction.get.mockImplementation((document: FakeDocument) => document.get());
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.deleteUploadsOrWarn.mockResolvedValue(undefined);
  uploads.publishUpload.mockResolvedValue(published);
});

describe("page service", () => {
  it("reads every page document at once", async () => {
    await getPages();

    expect(database.getAll).toHaveBeenCalledTimes(1);
    expect(database.getAll.mock.calls[0]?.map((document: FakeDocument) => document.path)).toEqual([
      "pages/home",
      "pages/gallery",
      "pages/projects",
      "pages/about",
      "pages/contacts",
    ]);
  });

  it("returns every page, with null until its hero is uploaded", async () => {
    storedHeroes.set("pages/about", storedHero);

    await expect(getPages()).resolves.toEqual({
      about: {
        hero: {
          ...storedHero,
          sources: {
            avif: [
              {
                url: "https://storage.test/pages/about/hero/old/960.avif?token=avif-token",
                width: 960,
              },
            ],
            webp: [
              {
                url: "https://storage.test/pages/about/hero/old/960.webp?token=webp-token",
                width: 960,
              },
            ],
          },
        },
      },
      contacts: { hero: null },
      gallery: { hero: null },
      home: { hero: null },
      projects: { hero: null },
    });
  });

  it("tags the hero of one page by what its document stores", async () => {
    storedHeroes.set("pages/about", storedHero);

    await expect(getPageHero("about")).resolves.toMatchObject({
      data: { version: "old" },
      etag: storedTag,
    });
    await expect(getPageHero("home")).resolves.toEqual({ data: null, etag: emptyTag });
  });

  it("puts the upload into a new version folder of its page and uses it up", async () => {
    const { created, data: hero, etag } = await savePageHero("about", uploadId, emptyTag);

    expect(created).toBe(true);
    expect(uploads.publishUpload).toHaveBeenCalledWith(uploadId, "pages/about/hero");
    expect(transaction.set).toHaveBeenCalledWith(
      aboutDocument,
      { hero: published },
      { merge: true },
    );
    expect(etag).toBe(entityTag(published));
    expect(hero.sources.webp[0]?.url).toBe(
      "https://storage.test/pages/about/hero/new/640.webp?token=token",
    );
    expect(uploads.deleteUploadsOrWarn).toHaveBeenCalledWith([uploadId]);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("reads the previous hero in the transaction that records the new one", async () => {
    await savePageHero("about", uploadId, emptyTag);

    expect(transaction.get).toHaveBeenCalledWith(aboutDocument);
  });

  it("deletes the previous hero after saving the new one", async () => {
    storedHeroes.set("pages/about", storedHero);

    const { created } = await savePageHero("about", uploadId, storedTag);

    expect(created).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/old");
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("removes the copy and keeps the upload when the hero cannot be recorded", async () => {
    transaction.set.mockImplementation(() => {
      throw new Error("Firestore is unavailable");
    });

    await expect(savePageHero("about", uploadId, emptyTag)).rejects.toThrow(
      "Firestore is unavailable",
    );

    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/new");
    expect(uploads.deleteUploadsOrWarn).not.toHaveBeenCalled();
  });

  it("records nothing when the upload cannot be published", async () => {
    uploads.publishUpload.mockRejectedValue(new Error("There is no upload"));

    await expect(savePageHero("about", uploadId, emptyTag)).rejects.toThrow("There is no upload");

    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("refuses a hero saved against an outdated read and removes its copy", async () => {
    storedHeroes.set("pages/about", storedHero);

    await expect(savePageHero("about", uploadId, emptyTag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/new");
  });

  it("deletes the hero and its files", async () => {
    storedHeroes.set("pages/about", storedHero);

    await expect(deletePageHero("about", storedTag)).resolves.toBe(emptyTag);

    expect(transaction.update).toHaveBeenCalledWith(aboutDocument, { hero: expect.anything() });
    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/old");
  });

  it("does nothing when deleting a missing hero", async () => {
    await expect(deletePageHero("about", emptyTag)).resolves.toBe(emptyTag);

    expect(transaction.update).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("refuses to delete a hero replaced since it was read", async () => {
    storedHeroes.set("pages/about", { ...storedHero, version: "newer" });

    await expect(deletePageHero("about", storedTag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
