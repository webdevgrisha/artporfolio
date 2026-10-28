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
  saveDownloadableFile: vi.fn(),
  saveFile: vi.fn(),
}));

const processImage = vi.hoisted(() => vi.fn());

vi.mock("#modules/contacts/document", () => ({ contactsDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/processing", () => ({ processImage }));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import {
  deleteContactPhoto,
  getContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#modules/contacts/photo/service";
import { NotFoundError } from "#shared/http/errors";

const upload = { data: Buffer.from("original"), name: "photo.png", size: 8 };

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

function encoded(format: "avif" | "webp", width: number) {
  return { data: Buffer.from(format), format, height: width / 2, width };
}

function storedAs(photo: unknown) {
  const snapshot = { get: () => photo };

  document.get.mockResolvedValue(snapshot);
  transaction.get.mockResolvedValue(snapshot);
}

function downloadablePaths(): string[] {
  return storage.saveDownloadableFile.mock.calls.map(([path]) => path as string);
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.deleteFolder.mockResolvedValue(undefined);
  storage.saveDownloadableFile.mockImplementation(async (path: string) => ({
    path,
    token: "token",
  }));
  storage.saveFile.mockResolvedValue(undefined);
  processImage.mockResolvedValue({
    images: [
      encoded("avif", 640),
      encoded("webp", 640),
      encoded("avif", 960),
      encoded("webp", 960),
    ],
    sourceFormat: "jpeg",
  });
  storedAs(undefined);
});

describe("contact photo service", () => {
  it("returns null when there is no photo", async () => {
    await expect(getContactPhoto()).resolves.toBeNull();
  });

  it("returns the stored photo with download URLs built from the stored paths", async () => {
    storedAs(storedPhoto);

    await expect(getContactPhoto()).resolves.toEqual(returnedPhoto);
  });

  it("stores the web images and the original in a new version folder", async () => {
    const photo = await saveContactPhoto(upload, "Portrait");
    const folder = `contacts/photo/${photo.version}`;

    expect(downloadablePaths()).toEqual([
      `${folder}/640.avif`,
      `${folder}/640.webp`,
      `${folder}/960.avif`,
      `${folder}/960.webp`,
    ]);
    expect(storage.saveDownloadableFile).toHaveBeenCalledWith(
      `${folder}/640.avif`,
      Buffer.from("avif"),
      {
        cacheControl: "public, max-age=31536000, immutable",
        contentType: "image/avif",
      },
    );
    expect(storage.saveFile).toHaveBeenCalledWith(`${folder}/original.jpeg`, upload.data, {
      contentType: "image/jpeg",
    });
    const stored = {
      alt: "Portrait",
      fileName: "photo.png",
      fileSize: 8,
      height: 480,
      sources: {
        avif: [
          { path: `${folder}/640.avif`, token: "token", width: 640 },
          { path: `${folder}/960.avif`, token: "token", width: 960 },
        ],
        webp: [
          { path: `${folder}/640.webp`, token: "token", width: 640 },
          { path: `${folder}/960.webp`, token: "token", width: 960 },
        ],
      },
      version: photo.version,
      width: 960,
    };

    expect(transaction.set).toHaveBeenCalledWith(document, { photo: stored }, { merge: true });
    expect(photo.sources.avif[0]).toEqual({
      url: `https://storage.test/${folder}/640.avif?token=token`,
      width: 640,
    });
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("reads the previous photo in the transaction that records the new one", async () => {
    await saveContactPhoto(upload, "Portrait");

    expect(transaction.get).toHaveBeenCalledWith(document);
    expect(document.get).not.toHaveBeenCalled();
  });

  it("deletes the previous version after saving the new one", async () => {
    storedAs(storedPhoto);

    await saveContactPhoto(upload, "Portrait");

    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/old-version");
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("succeeds when the previous version cannot be deleted", async () => {
    storedAs(storedPhoto);
    storage.deleteFolder.mockRejectedValue(new Error("Storage is unavailable"));

    await expect(saveContactPhoto(upload, "Portrait")).resolves.toMatchObject({ alt: "Portrait" });
  });

  it("removes the new files when an image cannot be stored", async () => {
    storage.saveDownloadableFile.mockRejectedValueOnce(new Error("Storage is unavailable"));

    await expect(saveContactPhoto(upload, "Portrait")).rejects.toThrow("Storage is unavailable");

    expect(storage.deleteFolder).toHaveBeenCalledWith(expect.stringMatching(/^contacts\/photo\//));
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("removes the new files when the photo cannot be recorded", async () => {
    transaction.set.mockImplementation(() => {
      throw new Error("Firestore is unavailable");
    });

    await expect(saveContactPhoto(upload, "Portrait")).rejects.toThrow("Firestore is unavailable");

    const [folder] = storage.deleteFolder.mock.calls[0] as [string];
    expect(downloadablePaths().every((path) => path.startsWith(`${folder}/`))).toBe(true);
  });

  it("does not store anything when the image is rejected", async () => {
    processImage.mockRejectedValue(new Error("Unsupported image format"));

    await expect(saveContactPhoto(upload, "Portrait")).rejects.toThrow("Unsupported image format");

    expect(storage.saveDownloadableFile).not.toHaveBeenCalled();
    expect(storage.saveFile).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("updates only the alt text", async () => {
    storedAs(storedPhoto);

    await expect(updateContactPhotoAlt("New alt")).resolves.toEqual({
      ...returnedPhoto,
      alt: "New alt",
    });
    expect(transaction.update).toHaveBeenCalledWith(document, { "photo.alt": "New alt" });
  });

  it("cannot update the alt text without a photo", async () => {
    await expect(updateContactPhotoAlt("New alt")).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("deletes the photo and its files", async () => {
    storedAs(storedPhoto);

    await deleteContactPhoto();

    expect(transaction.update).toHaveBeenCalledWith(document, { photo: expect.anything() });
    expect(storage.deleteFolder).toHaveBeenCalledWith("contacts/photo/old-version");
  });

  it("does nothing when deleting a missing photo", async () => {
    await deleteContactPhoto();

    expect(transaction.update).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });
});
