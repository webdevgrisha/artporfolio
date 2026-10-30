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

const uploads = vi.hoisted(() => ({
  deleteUploadsOrWarn: vi.fn(),
  publishUpload: vi.fn(),
}));

vi.mock("#modules/about/document", () => ({ aboutDocument: () => document }));
vi.mock("#shared/firebase/firestore", () => ({
  firestore: () => ({
    runTransaction: (update: (current: typeof transaction) => unknown) => update(transaction),
  }),
}));
vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/processing", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  processImage,
}));
vi.mock("#shared/images/uploads", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...uploads,
}));
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
  replaceProcessPhotos,
  updateProcessPhotoAlt,
} from "#modules/about/process-photos/service";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { entityTag } from "#shared/http/etag";

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

/** The image publishUpload makes from an upload, in a new version under `folder`. */
function publishedImage(folder: string) {
  const version = "new-version";

  return {
    fileName: "new.png",
    fileSize: 200,
    height: 480,
    sources: {
      avif: [{ path: `${folder}/${version}/960.avif`, token: "new-token", width: 960 }],
      webp: [{ path: `${folder}/${version}/960.webp`, token: "new-token", width: 960 }],
    },
    version,
    width: 960,
  };
}

/** The If-Match of a client that read the two saved photos. */
function readTag(): string {
  return entityTag([storedPhoto(firstId), storedPhoto(secondId)]);
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
  uploads.deleteUploadsOrWarn.mockResolvedValue(undefined);
  uploads.publishUpload.mockImplementation(async (_uploadId: string, folder: string) =>
    publishedImage(folder),
  );
});

describe("process photo service", () => {
  it("lists nothing before the first photo", async () => {
    storedAs(undefined);

    await expect(listProcessPhotos()).resolves.toEqual({
      etag: entityTag([]),
      processPhotos: [],
    });
  });

  it("lists the photos in order with download URLs", async () => {
    const { processPhotos: photos } = await listProcessPhotos();

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

describe("replaceProcessPhotos", () => {
  const uploadId = "44444444-4444-4444-8444-444444444444";

  it("writes the list in the given order, with the new alt texts", async () => {
    const list = await replaceProcessPhotos(
      [
        { alt: "Second", id: secondId },
        { alt: "First", id: firstId },
      ],
      readTag(),
    );

    expect(writtenPhotos().map(({ alt, id }) => ({ alt, id }))).toEqual([
      { alt: "Second", id: secondId },
      { alt: "First", id: firstId },
    ]);
    expect(list.processPhotos.map((photo) => photo.id)).toEqual([secondId, firstId]);
    expect(list.etag).toBe(entityTag(writtenPhotos()));
    expect(uploads.publishUpload).not.toHaveBeenCalled();
    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("adds a new photo from its upload, in a folder of its own", async () => {
    const list = await replaceProcessPhotos(
      [
        { alt: "First", id: firstId },
        { alt: "Second", id: secondId },
        { alt: "New", uploadId },
      ],
      readTag(),
    );
    const added = list.processPhotos[2];

    expect(uploads.publishUpload).toHaveBeenCalledWith(
      uploadId,
      `about/process-photos/${String(added?.id)}`,
    );
    expect(writtenPhotos()[2]).toMatchObject({ alt: "New", id: added?.id, version: "new-version" });
    expect(uploads.deleteUploadsOrWarn).toHaveBeenCalledWith([uploadId]);
  });

  it("replaces the file of a saved photo in place and deletes its previous version", async () => {
    await replaceProcessPhotos(
      [
        { alt: "First", id: firstId, uploadId },
        { alt: "Second", id: secondId },
      ],
      readTag(),
    );

    expect(writtenPhotos()[0]).toMatchObject({ id: firstId, version: "new-version" });
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `about/process-photos/${firstId}/old-version`,
    );
    expect(storage.deleteFolder).toHaveBeenCalledTimes(1);
  });

  it("deletes the files of a photo left out", async () => {
    await replaceProcessPhotos([{ alt: "First", id: firstId }], readTag());

    expect(writtenPhotos().map(({ id }) => id)).toEqual([firstId]);
    expect(storage.deleteFolder).toHaveBeenCalledWith(`about/process-photos/${secondId}`);
  });

  it("returns 412 when the list has changed since it was read, and removes the copies", async () => {
    await expect(
      replaceProcessPhotos([{ alt: "New", uploadId }], entityTag([storedPhoto(firstId)])),
    ).rejects.toBeInstanceOf(PreconditionFailedError);

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(/^about\/process-photos\/[0-9a-f-]{36}\/new-version$/),
    );
    expect(uploads.deleteUploadsOrWarn).not.toHaveBeenCalled();
  });

  it("accepts any list for If-Match: *", async () => {
    await replaceProcessPhotos([{ alt: "First", id: firstId }], "*");

    expect(transaction.set).toHaveBeenCalled();
  });

  it("returns 422 for a saved photo that does not exist", async () => {
    await expect(
      replaceProcessPhotos([{ alt: "Unknown", id: unknownId, uploadId }], readTag()),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `about/process-photos/${unknownId}/new-version`,
    );
  });

  it("removes the copies made so far when an upload cannot be published", async () => {
    const otherUploadId = "55555555-5555-4555-8555-555555555555";
    uploads.publishUpload
      .mockImplementationOnce(async (_uploadId: string, folder: string) => publishedImage(folder))
      .mockRejectedValueOnce(new UnprocessableContentError("There is no upload"));

    await expect(
      replaceProcessPhotos(
        [
          { alt: "First", id: firstId, uploadId },
          { alt: "New", uploadId: otherUploadId },
        ],
        readTag(),
      ),
    ).rejects.toBeInstanceOf(UnprocessableContentError);

    expect(transaction.set).not.toHaveBeenCalled();
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      `about/process-photos/${firstId}/new-version`,
    );
  });
});
