import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));

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

import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { PreconditionFailedError, UnprocessableContentError } from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";
import {
  getPhoto,
  photoBodySchema,
  photoSlot,
  readPhoto,
  savePhoto,
  toPhoto,
} from "#shared/images/photo";

const slot = photoSlot({
  document: () => document as unknown as DocumentReference,
  field: "photo",
  folder: "contacts/photo",
  resource: "contacts-photo",
});

const uploadId = "11111111-1111-4111-8111-111111111111";

/** The image publishUpload copies from the upload into a new version folder. */
const published = {
  fileName: "photo.png",
  fileSize: 8,
  height: 480,
  originalPath: "contacts/photo/new-version/original.png",
  sources: {
    avif: [{ path: "contacts/photo/new-version/960.avif", token: "token", width: 960 }],
    webp: [{ path: "contacts/photo/new-version/960.webp", token: "token", width: 960 }],
  },
  version: "new-version",
  width: 960,
};

const storedPhoto = {
  alt: "Portrait",
  fileName: "old.png",
  fileSize: 100,
  height: 700,
  originalPath: "old/original.png",
  sources: {
    avif: [{ path: "old/1000.avif", token: "avif-token", width: 1_000 }],
    webp: [{ path: "old/1000.webp", token: "webp-token", width: 1_000 }],
  },
  version: "old-version",
  width: 1_000,
};

/** storedPhoto as the API returns it. */
const returnedPhoto = {
  alt: "Portrait",
  fileName: "old.png",
  fileSize: 100,
  height: 700,
  original: "/api/originals/old/original.png",
  version: "old-version",
  width: 1_000,
  sources: {
    avif: [{ url: "https://storage.test/old/1000.avif?token=avif-token", width: 1_000 }],
    webp: [{ url: "https://storage.test/old/1000.webp?token=webp-token", width: 1_000 }],
  },
};

/** The tags of the empty slot and of the slot with `storedPhoto`, as a client read them. */
const emptyTag = entityTag(null);
const storedTag = entityTag(storedPhoto);

function snapshotWith(photo: unknown) {
  return { get: () => photo } as unknown as DocumentSnapshot;
}

function storedAs(photo: unknown) {
  transaction.get.mockResolvedValue(snapshotWith(photo));
}

/** The photo of the document as the API returns it. */
function returned(photo: unknown) {
  const stored = readPhoto(slot, snapshotWith(photo));

  return stored && toPhoto(stored);
}

beforeEach(() => {
  vi.resetAllMocks();
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.publishUpload.mockResolvedValue(published);
  storedAs(undefined);
});

describe("photo", () => {
  it("returns null when there is no photo", () => {
    expect(returned(undefined)).toBeNull();
  });

  it("returns the stored photo with download URLs built from the stored paths", () => {
    expect(returned(storedPhoto)).toEqual(returnedPhoto);
  });

  it("tags the photo by what the slot stores, null while it is empty", async () => {
    document.get.mockResolvedValue(snapshotWith(storedPhoto));
    await expect(getPhoto(slot)).resolves.toEqual({
      data: returnedPhoto,
      etag: entityTag(storedPhoto),
    });

    document.get.mockResolvedValue(snapshotWith(undefined));
    await expect(getPhoto(slot)).resolves.toEqual({ data: null, etag: emptyTag });
  });

  it("puts the upload into a new version folder of the slot and keeps the upload", async () => {
    const { created, data, etag } = await savePhoto(slot, { alt: "Portrait", uploadId }, emptyTag);
    const stored = { ...published, alt: "Portrait" };

    expect(created).toBe(true);
    expect(uploads.publishUpload).toHaveBeenCalledWith(uploadId, "contacts/photo");
    expect(transaction.set).toHaveBeenCalledWith(document, { photo: stored }, { merge: true });
    expect(etag).toBe(entityTag(stored));
    expect(data.sources.avif[0]).toEqual({
      url: "https://storage.test/contacts/photo/new-version/960.avif?token=token",
      width: 960,
    });
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("reads the previous photo in the transaction that records the new one", async () => {
    await savePhoto(slot, { alt: "Portrait", uploadId }, emptyTag);

    expect(transaction.get).toHaveBeenCalledWith(document);
    expect(document.get).not.toHaveBeenCalled();
  });

  it("deletes the previous version after saving the new one", async () => {
    storedAs(storedPhoto);

    const { created } = await savePhoto(slot, { alt: "Portrait", uploadId }, storedTag);

    expect(created).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/old-version");
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("succeeds when the previous version cannot be deleted", async () => {
    storedAs(storedPhoto);
    storage.deleteFolder.mockRejectedValue(new Error("Storage is unavailable"));

    await expect(savePhoto(slot, { alt: "Portrait", uploadId }, storedTag)).resolves.toMatchObject({
      data: { alt: "Portrait" },
    });
  });

  it("records nothing when the upload cannot be published", async () => {
    uploads.publishUpload.mockRejectedValue(new Error("There is no upload"));

    await expect(savePhoto(slot, { alt: "Portrait", uploadId }, emptyTag)).rejects.toThrow(
      "There is no upload",
    );

    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("removes the copy and keeps the upload when the photo cannot be recorded", async () => {
    transaction.set.mockImplementation(() => {
      throw new Error("Firestore is unavailable");
    });

    await expect(savePhoto(slot, { alt: "Portrait", uploadId }, emptyTag)).rejects.toThrow(
      "Firestore is unavailable",
    );

    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/new-version");
  });

  it("refuses a photo saved against an outdated read and removes its copy", async () => {
    storedAs(storedPhoto);

    await expect(savePhoto(slot, { alt: "Portrait", uploadId }, emptyTag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/new-version");
  });

  it("reads a saved alt text longer than today's limit", () => {
    const longer = { ...storedPhoto, alt: "a".repeat(500) };

    expect(returned(longer)).toMatchObject({ alt: longer.alt });
  });

  it("updates only the alt text", async () => {
    storedAs(storedPhoto);
    const stored = { ...storedPhoto, alt: "New alt" };

    await expect(savePhoto(slot, { alt: "New alt" }, storedTag)).resolves.toEqual({
      created: false,
      data: { ...returnedPhoto, alt: "New alt" },
      etag: entityTag(stored),
    });
    expect(transaction.set).toHaveBeenCalledWith(document, { photo: stored }, { merge: true });
  });

  it("cannot keep the file of an empty slot", async () => {
    await expect(savePhoto(slot, { alt: "New alt" }, emptyTag)).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("refuses an alt text for a photo replaced since it was read", async () => {
    storedAs({ ...storedPhoto, version: "newer-version" });

    await expect(savePhoto(slot, { alt: "New alt" }, storedTag)).rejects.toBeInstanceOf(
      PreconditionFailedError,
    );
    expect(transaction.set).not.toHaveBeenCalled();
  });
});

function isValid(body: unknown): boolean {
  return photoBodySchema.safeParse(body).success;
}

describe("photo body", () => {
  it("trims the alt text", () => {
    expect(photoBodySchema.parse({ alt: "  Портрет художницы  " })).toEqual({
      alt: "Портрет художницы",
    });
  });

  it.each(["", "   "])("requires alt text, rejecting %j", (alt) => {
    expect(isValid({ alt })).toBe(false);
  });

  it("limits the alt text to 250 characters", () => {
    expect(isValid({ alt: "a".repeat(250) })).toBe(true);
    expect(isValid({ alt: "a".repeat(251) })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ alt: "Портрет", title: "Портрет" })).toBe(false);
  });
});
