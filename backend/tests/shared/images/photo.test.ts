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
  deleteUploadsOrWarn: vi.fn(),
  publishUpload: vi.fn(),
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

import type { DocumentSnapshot } from "firebase-admin/firestore";
import { NotFoundError } from "#shared/http/errors";
import {
  deletePhoto,
  type PhotoSlot,
  photoAltBodySchema,
  readPhoto,
  savePhoto,
  toPhoto,
  updatePhotoAlt,
} from "#shared/images/photo";

const slot = {
  document: () => document,
  field: "photo",
  folder: "contacts/photo",
} as unknown as PhotoSlot;

const uploadId = "11111111-1111-4111-8111-111111111111";

/** The image publishUpload copies from the upload into a new version folder. */
const published = {
  fileName: "photo.png",
  fileSize: 8,
  height: 480,
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
  sources: {
    avif: [{ path: "old/1000.avif", token: "avif-token", width: 1_000 }],
    webp: [{ path: "old/1000.webp", token: "webp-token", width: 1_000 }],
  },
  version: "old-version",
  width: 1_000,
};

/** storedPhoto as the API returns it. */
const returnedPhoto = {
  ...storedPhoto,
  sources: {
    avif: [{ url: "https://storage.test/old/1000.avif?token=avif-token", width: 1_000 }],
    webp: [{ url: "https://storage.test/old/1000.webp?token=webp-token", width: 1_000 }],
  },
};

function snapshotWith(photo: unknown) {
  return { get: () => photo } as unknown as DocumentSnapshot;
}

function storedAs(photo: unknown) {
  transaction.get.mockResolvedValue(snapshotWith(photo));
}

/** The photo of the document as the API returns it. */
function returned(photo: unknown) {
  const stored = readPhoto(snapshotWith(photo), "photo");

  return stored && toPhoto(stored);
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.deleteFolder.mockResolvedValue(undefined);
  uploads.deleteUploadsOrWarn.mockResolvedValue(undefined);
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

  it("puts the upload into a new version folder of the slot and uses it up", async () => {
    const { created, photo } = await savePhoto(slot, { alt: "Portrait", uploadId });

    expect(created).toBe(true);
    expect(uploads.publishUpload).toHaveBeenCalledWith(uploadId, "contacts/photo");
    expect(transaction.set).toHaveBeenCalledWith(
      document,
      { photo: { ...published, alt: "Portrait" } },
      { merge: true },
    );
    expect(photo.sources.avif[0]).toEqual({
      url: "https://storage.test/contacts/photo/new-version/960.avif?token=token",
      width: 960,
    });
    expect(uploads.deleteUploadsOrWarn).toHaveBeenCalledWith([uploadId]);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("reads the previous photo in the transaction that records the new one", async () => {
    await savePhoto(slot, { alt: "Portrait", uploadId });

    expect(transaction.get).toHaveBeenCalledWith(document);
    expect(document.get).not.toHaveBeenCalled();
  });

  it("deletes the previous version after saving the new one", async () => {
    storedAs(storedPhoto);

    const { created } = await savePhoto(slot, { alt: "Portrait", uploadId });

    expect(created).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/old-version");
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("succeeds when the previous version cannot be deleted", async () => {
    storedAs(storedPhoto);
    storage.deleteFolder.mockRejectedValue(new Error("Storage is unavailable"));

    await expect(savePhoto(slot, { alt: "Portrait", uploadId })).resolves.toMatchObject({
      photo: { alt: "Portrait" },
    });
  });

  it("records nothing when the upload cannot be published", async () => {
    uploads.publishUpload.mockRejectedValue(new Error("There is no upload"));

    await expect(savePhoto(slot, { alt: "Portrait", uploadId })).rejects.toThrow(
      "There is no upload",
    );

    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("removes the copy and keeps the upload when the photo cannot be recorded", async () => {
    transaction.set.mockImplementation(() => {
      throw new Error("Firestore is unavailable");
    });

    await expect(savePhoto(slot, { alt: "Portrait", uploadId })).rejects.toThrow(
      "Firestore is unavailable",
    );

    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/new-version");
    expect(uploads.deleteUploadsOrWarn).not.toHaveBeenCalled();
  });

  it("reads a saved alt text longer than today's limit", () => {
    const longer = { ...storedPhoto, alt: "a".repeat(500) };

    expect(returned(longer)).toMatchObject({ alt: longer.alt });
  });

  it("updates only the alt text", async () => {
    storedAs(storedPhoto);

    await expect(updatePhotoAlt(slot, "New alt")).resolves.toEqual({
      ...returnedPhoto,
      alt: "New alt",
    });
    expect(transaction.update).toHaveBeenCalledWith(document, { "photo.alt": "New alt" });
  });

  it("cannot update the alt text without a photo", async () => {
    await expect(updatePhotoAlt(slot, "New alt")).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("deletes the photo and its files", async () => {
    storedAs(storedPhoto);

    await deletePhoto(slot);

    expect(transaction.update).toHaveBeenCalledWith(document, { photo: expect.anything() });
    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/old-version");
  });

  it("does nothing when deleting a missing photo", async () => {
    await deletePhoto(slot);

    expect(transaction.update).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });
});

function isValid(body: unknown): boolean {
  return photoAltBodySchema.safeParse(body).success;
}

describe("photo alt body", () => {
  it("trims the alt text", () => {
    expect(photoAltBodySchema.parse({ alt: "  Портрет художницы  " })).toEqual({
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
