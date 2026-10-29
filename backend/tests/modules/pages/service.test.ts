import { beforeEach, describe, expect, it, vi } from "vitest";

interface FakeDocument {
  id: string;
  path: string;
}

/** The stored hero of each page document, by document path. */
const storedHeroes = vi.hoisted(() => new Map<string, unknown>());

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));

const database = vi.hoisted(() => ({
  doc: (path: string): FakeDocument => ({ id: path.slice(path.lastIndexOf("/") + 1), path }),
  getAll: vi.fn(),
  runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
}));

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
  saveDownloadableFile: vi.fn(),
  saveFile: vi.fn(),
}));

const processImage = vi.hoisted(() => vi.fn());

vi.mock("#shared/firebase/firestore", () => ({ firestore: () => database }));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/processing", () => ({ processImage }));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { deletePageHero, getPages, savePageHero } from "#modules/pages/service";

const upload = { data: Buffer.from("original"), name: "painting.jpg", size: 8 };

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

function encoded(format: "avif" | "webp", width: number) {
  return { data: Buffer.from(format), format, height: width / 2, width };
}

function snapshotOf(document: FakeDocument) {
  return {
    get: (field: string) => (field === "hero" ? storedHeroes.get(document.path) : undefined),
    id: document.id,
  };
}

function downloadablePaths(): string[] {
  return storage.saveDownloadableFile.mock.calls.map(([path]) => path as string);
}

beforeEach(() => {
  vi.clearAllMocks();
  storedHeroes.clear();
  database.getAll.mockImplementation(async (...documents: FakeDocument[]) =>
    documents.map(snapshotOf),
  );
  transaction.get.mockImplementation(async (document: FakeDocument) => snapshotOf(document));
  storage.deleteFolder.mockResolvedValue(undefined);
  storage.saveDownloadableFile.mockImplementation(async (path: string) => ({
    path,
    token: "token",
  }));
  storage.saveFile.mockResolvedValue(undefined);
  processImage.mockResolvedValue({
    images: [encoded("avif", 640), encoded("webp", 640)],
    sourceFormat: "jpeg",
  });
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

  it("stores the hero in a new version folder of its page", async () => {
    const { created, hero } = await savePageHero("about", upload);
    const folder = `pages/about/hero/${hero.version}`;

    expect(created).toBe(true);

    expect(downloadablePaths()).toEqual([`${folder}/640.avif`, `${folder}/640.webp`]);
    expect(storage.saveFile).toHaveBeenCalledWith(`${folder}/original.jpeg`, upload.data, {
      contentType: "image/jpeg",
    });
    expect(transaction.set).toHaveBeenCalledWith(
      aboutDocument,
      {
        hero: {
          fileName: "painting.jpg",
          fileSize: 8,
          height: 320,
          sources: {
            avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
            webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
          },
          version: hero.version,
          width: 640,
        },
      },
      { merge: true },
    );
    expect(hero.sources.webp[0]?.url).toBe(`https://storage.test/${folder}/640.webp?token=token`);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("reads the previous hero in the transaction that records the new one", async () => {
    await savePageHero("about", upload);

    expect(transaction.get).toHaveBeenCalledWith(aboutDocument);
  });

  it("deletes the previous hero after saving the new one", async () => {
    storedHeroes.set("pages/about", storedHero);

    const { created } = await savePageHero("about", upload);

    expect(created).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/old");
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("removes the new files when the hero cannot be recorded", async () => {
    transaction.set.mockImplementation(() => {
      throw new Error("Firestore is unavailable");
    });

    await expect(savePageHero("about", upload)).rejects.toThrow("Firestore is unavailable");

    const [folder] = storage.deleteFolder.mock.calls[0] as [string];
    expect(folder).toMatch(/^pages\/about\/hero\//);
    expect(downloadablePaths().every((path) => path.startsWith(`${folder}/`))).toBe(true);
  });

  it("does not store anything when the image is rejected", async () => {
    processImage.mockRejectedValue(new Error("Unsupported image format"));

    await expect(savePageHero("about", upload)).rejects.toThrow("Unsupported image format");

    expect(storage.saveDownloadableFile).not.toHaveBeenCalled();
    expect(storage.saveFile).not.toHaveBeenCalled();
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("deletes the hero and its files", async () => {
    storedHeroes.set("pages/about", storedHero);

    await deletePageHero("about");

    expect(transaction.update).toHaveBeenCalledWith(aboutDocument, { hero: expect.anything() });
    expect(storage.deleteFolder).toHaveBeenCalledWith("pages/about/hero/old");
  });

  it("does nothing when deleting a missing hero", async () => {
    await deletePageHero("about");

    expect(transaction.update).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });
});
