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
  saveDownloadableFile: vi.fn(),
  saveFile: vi.fn(),
}));

const processImage = vi.hoisted(() => vi.fn());

vi.mock("#modules/about/document", () => ({ aboutDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/processing", () => ({ processImage }));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { maxProcessPhotos } from "#modules/about/process-photos/schema";
import {
  addProcessPhoto,
  deleteProcessPhoto,
  getProcessPhoto,
  getProcessPhotoOrder,
  listProcessPhotos,
  reorderProcessPhotos,
  replaceProcessPhoto,
  updateProcessPhotoAlt,
} from "#modules/about/process-photos/service";
import { ConflictError, NotFoundError } from "#shared/http/errors";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const unknownId = "33333333-3333-4333-8333-333333333333";

const upload = { data: Buffer.from("original"), name: "sketch.png", size: 8 };

function storedPhoto(id: string) {
  const folder = `about/process-photos/${id}/old-version`;

  return {
    alt: `Photo ${id}`,
    fileName: "old.png",
    fileSize: 100,
    height: 320,
    id,
    sources: {
      avif: [{ path: `${folder}/640.avif`, token: "token", width: 640 }],
      webp: [{ path: `${folder}/640.webp`, token: "token", width: 640 }],
    },
    version: "old-version",
    width: 640,
  };
}

function storedAs(photos: unknown[] | undefined) {
  const snapshot = { get: () => photos };

  document.get.mockResolvedValue(snapshot);
  transaction.get.mockResolvedValue(snapshot);
}

/** The photos written by the last transaction. */
function writtenPhotos(): { alt: string; id: string; version: string }[] {
  const [, data] = transaction.set.mock.lastCall as [unknown, { processPhotos: [] }];

  return data.processPhotos;
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
      { data: Buffer.from("avif"), format: "avif", height: 320, width: 640 },
      { data: Buffer.from("webp"), format: "webp", height: 320, width: 640 },
    ],
    sourceFormat: "jpeg",
  });
  storedAs([storedPhoto(firstId), storedPhoto(secondId)]);
});

describe("process photo service", () => {
  it("lists nothing before the first photo", async () => {
    storedAs(undefined);

    await expect(listProcessPhotos()).resolves.toEqual([]);
  });

  it("lists the photos in order with download URLs", async () => {
    const photos = await listProcessPhotos();

    expect(photos.map((photo) => photo.id)).toEqual([firstId, secondId]);
    expect(photos[0]?.sources.avif[0]?.url).toBe(
      `https://storage.test/about/process-photos/${firstId}/old-version/640.avif?token=token`,
    );
  });

  it("returns 404 for an unknown photo", async () => {
    await expect(getProcessPhoto(unknownId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("adds a photo after the others, in a folder of its own", async () => {
    const photo = await addProcessPhoto(upload, "Sketch");

    expect(writtenPhotos().map(({ id }) => id)).toEqual([firstId, secondId, photo.id]);
    expect(writtenPhotos()[2]).toMatchObject({ alt: "Sketch", id: photo.id });
    expect(storage.saveFile).toHaveBeenCalledWith(
      `about/process-photos/${photo.id}/${photo.version}/original.jpeg`,
      upload.data,
      { contentType: "image/jpeg" },
    );
    expect(transaction.set).toHaveBeenCalledWith(document, expect.anything(), { merge: true });
  });

  it("rejects a photo over the limit and removes its files", async () => {
    const full = Array.from({ length: maxProcessPhotos }, () => storedPhoto(firstId));
    transaction.get.mockResolvedValue({ get: () => full });

    await expect(addProcessPhoto(upload, "Sketch")).rejects.toBeInstanceOf(ConflictError);

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(/^about\/process-photos\/[0-9a-f-]{36}$/),
    );
  });

  it("replaces the file in place and deletes the previous version", async () => {
    const photo = await replaceProcessPhoto(firstId, upload, "New sketch");

    expect(photo.id).toBe(firstId);
    expect(photo.version).not.toBe("old-version");
    expect(writtenPhotos().map(({ id }) => id)).toEqual([firstId, secondId]);
    expect(writtenPhotos()[0]).toMatchObject({ alt: "New sketch", version: photo.version });
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `about/process-photos/${firstId}/old-version`,
    );
    expect(transaction.set.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFolder.mock.invocationCallOrder[0] as number,
    );
  });

  it("rejects replacing an unknown photo and removes the new version", async () => {
    transaction.get.mockResolvedValue({ get: () => [storedPhoto(secondId)] });

    await expect(replaceProcessPhoto(firstId, upload, "Sketch")).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(storage.deleteFolder).toHaveBeenCalledTimes(1);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^about/process-photos/${firstId}/[0-9a-f-]{36}$`)),
    );
  });

  it("changes only the alt text", async () => {
    const photo = await updateProcessPhotoAlt(secondId, "New alt");

    expect(photo).toMatchObject({ alt: "New alt", id: secondId, version: "old-version" });
    expect(writtenPhotos().map(({ alt }) => alt)).toEqual([`Photo ${firstId}`, "New alt"]);
  });

  it("deletes a photo with every version of its files", async () => {
    await deleteProcessPhoto(firstId);

    expect(writtenPhotos().map(({ id }) => id)).toEqual([secondId]);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`about/process-photos/${firstId}`);
  });

  it("returns 404 when deleting an unknown photo", async () => {
    await expect(deleteProcessPhoto(unknownId)).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("returns the order", async () => {
    await expect(getProcessPhotoOrder()).resolves.toEqual([firstId, secondId]);
  });

  it("reorders the photos", async () => {
    await expect(reorderProcessPhotos([secondId, firstId])).resolves.toEqual([secondId, firstId]);
    expect(writtenPhotos().map(({ id }) => id)).toEqual([secondId, firstId]);
  });

  it.each([
    ["misses a photo", [secondId]],
    ["names an unknown photo", [secondId, unknownId]],
    ["adds a photo", [secondId, firstId, unknownId]],
  ])("rejects an order that %s", async (_, ids) => {
    await expect(reorderProcessPhotos(ids)).rejects.toBeInstanceOf(ConflictError);
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
