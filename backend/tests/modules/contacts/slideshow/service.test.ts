import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const uploads = vi.hoisted(() => ({
  publishUpload: vi.fn(),
}));

const translationRequests = vi.hoisted(() => ({
  deleteTranslations: vi.fn(),
  requestTranslations: vi.fn(),
  saveSources: vi.fn(),
}));

vi.mock("#shared/i18n/translation-requests", () => translationRequests);
vi.mock("#modules/contacts/document", () => ({ contactsDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...uploads,
}));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { getSlideshow, replaceSlideshow } from "#modules/contacts/slideshow/service";
import { PreconditionFailedError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const uploadId = "44444444-4444-4444-8444-444444444444";

function storedPhoto(id: string) {
  const folder = `contacts/slideshow/${id}/old-version`;

  return {
    alt: `Photo ${id}`,
    fileName: "old.png",
    fileSize: 100,
    height: 320,
    id,
    originalPath: `${folder}/original.png`,
    placeholder: "data:image/webp;base64,UklGRg==",
    sources: {
      avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
      webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
    },
    version: "old-version",
    width: 640,
  };
}

const saved = { photos: [storedPhoto(firstId), storedPhoto(secondId)], source: "uploaded" };

function storedAs(slideshow: unknown) {
  const snapshot = { get: (field: string) => (field === "slideshow" ? slideshow : undefined) };

  document.get.mockResolvedValue(snapshot);
  transaction.get.mockResolvedValue(snapshot);
}

/** The slideshow written by the last transaction. */
function written(): { photos: { alt: string; id: string; version: string }[]; source: string } {
  const [, data] = transaction.set.mock.lastCall as [unknown, { slideshow: never }];

  return data.slideshow;
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.deleteFolder.mockResolvedValue(undefined);
  storedAs(saved);
  uploads.publishUpload.mockImplementation(async (_uploadId: string, folder: string) => ({
    fileName: "new.png",
    fileSize: 200,
    height: 480,
    originalPath: `${folder}/new-version/original.png`,
    placeholder: "data:image/webp;base64,UklGRg==",
    sources: {
      avif: [{ path: `${folder}/new-version/960.avif`, token: "new-token", width: 960 }],
      webp: [{ path: `${folder}/new-version/960.webp`, token: "new-token", width: 960 }],
    },
    version: "new-version",
    width: 960,
  }));
});

describe("getSlideshow", () => {
  it("shows the uploaded photos, of which there are none, before the first save", async () => {
    storedAs(undefined);

    await expect(getSlideshow()).resolves.toEqual({
      data: { photos: [], source: "uploaded" },
      etag: entityTag({ photos: [], source: "uploaded" }),
    });
  });

  it("returns the source and the photos in order with download URLs", async () => {
    storedAs({ ...saved, source: "gallery" });

    const { data } = await getSlideshow();

    expect(data.source).toBe("gallery");
    expect(data.photos.map(({ id }) => id)).toEqual([firstId, secondId]);
    expect(data.photos[0]?.sources.avif[0]?.url).toBe(
      `https://storage.test/contacts/slideshow/${firstId}/old-version/640.avif?token=token`,
    );
  });
});

describe("replaceSlideshow", () => {
  it("writes the source and keeps the uploaded photos while the gallery is shown", async () => {
    const slideshow = await replaceSlideshow(
      {
        photos: [
          { alt: "Second", id: secondId },
          { alt: "First", id: firstId },
        ],
        source: "gallery",
      },
      entityTag(saved),
    );

    expect(written().source).toBe("gallery");
    expect(written().photos.map(({ alt, id }) => ({ alt, id }))).toEqual([
      { alt: "Second", id: secondId },
      { alt: "First", id: firstId },
    ]);
    expect(slideshow.data.source).toBe("gallery");
    expect(slideshow.etag).toBe(entityTag(written()));
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("adds a new photo in a folder of its own and deletes a photo left out", async () => {
    const slideshow = await replaceSlideshow(
      {
        photos: [
          { alt: "First", id: firstId },
          { alt: "New", uploadId },
        ],
        source: "uploaded",
      },
      entityTag(saved),
    );
    const added = slideshow.data.photos[1];

    expect(uploads.publishUpload).toHaveBeenCalledWith(
      uploadId,
      `contacts/slideshow/${String(added?.id)}`,
    );
    expect(storage.deleteFolder).toHaveBeenCalledWith(`contacts/slideshow/${secondId}`);
  });

  it("sends the alt texts to translation, each by the id of its photo", async () => {
    await replaceSlideshow(
      { photos: [{ alt: "First", id: firstId }], source: "uploaded" },
      entityTag(saved),
    );

    expect(translationRequests.saveSources).toHaveBeenCalledWith(
      transaction,
      "contacts-slideshow",
      { [firstId]: "First" },
    );
    expect(translationRequests.requestTranslations).toHaveBeenCalledWith("contacts-slideshow");
  });

  it("returns 412 when the slideshow has changed since it was read", async () => {
    await expect(
      replaceSlideshow(
        { photos: [], source: "gallery" },
        entityTag({ ...saved, source: "gallery" }),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(transaction.set).not.toHaveBeenCalled();
  });
});
