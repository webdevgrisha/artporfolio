import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  copyFile: vi.fn(),
  copyToDownloadableFile: vi.fn(),
  deleteFolder: vi.fn(),
  readFile: vi.fn(),
  saveFile: vi.fn(),
}));

const processImage = vi.hoisted(() => vi.fn());

vi.mock("#shared/firebase/storage", () => storage);
vi.mock("#shared/images/processing", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  processImage,
}));
vi.mock("firebase-functions/logger", () => ({ warn: vi.fn() }));

import { UnprocessableContentError } from "#shared/http/errors";
import { deleteUploadsOrWarn, publishUpload, saveUpload } from "#shared/images/uploads";

const file = { data: Buffer.from("original"), name: "sketch.png", size: 8 };

const manifest = {
  fileName: "sketch.png",
  fileSize: 8,
  height: 480,
  images: [
    { format: "avif", width: 640 },
    { format: "webp", width: 640 },
    { format: "avif", width: 960 },
    { format: "webp", width: 960 },
  ],
  sourceFormat: "png",
  width: 960,
};

function encoded(format: "avif" | "webp", width: number) {
  return { data: Buffer.from(`${format} ${String(width)}`), format, height: width / 2, width };
}

/** The paths saved by saveFile, in the order the writes started. */
function savedPaths(): string[] {
  return storage.saveFile.mock.calls.map(([path]) => String(path));
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.copyFile.mockResolvedValue(undefined);
  storage.copyToDownloadableFile.mockImplementation(async (_from: string, to: string) => ({
    path: to,
    token: `${to} token`,
  }));
  storage.deleteFolder.mockResolvedValue(undefined);
  storage.readFile.mockResolvedValue(Buffer.from(JSON.stringify(manifest)));
  storage.saveFile.mockResolvedValue(undefined);
  processImage.mockResolvedValue({
    images: [
      encoded("avif", 640),
      encoded("webp", 640),
      encoded("avif", 960),
      encoded("webp", 960),
    ],
    sourceFormat: "png",
  });
});

describe("saveUpload", () => {
  it("keeps the web images and the original privately, then the manifest", async () => {
    const id = await saveUpload(file);

    expect(savedPaths()).toEqual([
      `uploads/${id}/640.avif`,
      `uploads/${id}/640.webp`,
      `uploads/${id}/960.avif`,
      `uploads/${id}/960.webp`,
      `uploads/${id}/original.png`,
      `uploads/${id}/upload.json`,
    ]);
    expect(storage.saveFile).toHaveBeenCalledWith(`uploads/${id}/original.png`, file.data, {
      contentType: "image/png",
    });
    const [, data] = storage.saveFile.mock.lastCall as [string, Buffer];
    expect(JSON.parse(data.toString())).toEqual(manifest);
  });

  it("removes the saved files and writes no manifest when a write fails", async () => {
    storage.saveFile.mockRejectedValueOnce(new Error("Storage is down"));

    await expect(saveUpload(file)).rejects.toThrow("Storage is down");

    expect(savedPaths().some((path) => path.endsWith("upload.json"))).toBe(false);
    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[0-9a-f-]{36}$/),
    );
  });
  it("fails only after every write has ended, so no file is added after the cleanup", async () => {
    const error = new Error("Storage is down");
    const finishSlowWrites: (() => void)[] = [];
    storage.saveFile.mockImplementation((path: string) =>
      path.endsWith("original.png")
        ? Promise.reject(error)
        : new Promise<void>((resolve) => {
            finishSlowWrites.push(resolve);
          }),
    );
    let failed = false;
    const saving = saveUpload(file).catch((reason: unknown) => {
      failed = true;
      return reason;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(failed).toBe(false);
    expect(storage.deleteFolder).not.toHaveBeenCalled();

    for (const finish of finishSlowWrites) finish();

    await expect(saving).resolves.toBe(error);
    expect(storage.deleteFolder).toHaveBeenCalled();
  });
});

describe("publishUpload", () => {
  const uploadId = "11111111-1111-4111-8111-111111111111";

  it("copies the upload into a new version folder, the web images with download tokens", async () => {
    const image = await publishUpload(uploadId, "about/process-photos/photo-id");
    const target = `about/process-photos/photo-id/${image.version}`;

    expect(storage.readFile).toHaveBeenCalledWith(`uploads/${uploadId}/upload.json`);
    expect(storage.copyToDownloadableFile).toHaveBeenCalledWith(
      `uploads/${uploadId}/960.webp`,
      `${target}/960.webp`,
      { cacheControl: "public, max-age=31536000, immutable", contentType: "image/webp" },
    );
    expect(storage.copyFile).toHaveBeenCalledWith(
      `uploads/${uploadId}/original.png`,
      `${target}/original.png`,
      { contentType: "image/png" },
    );
    expect(image).toEqual({
      fileName: "sketch.png",
      fileSize: 8,
      height: 480,
      sources: {
        avif: [
          { path: `${target}/640.avif`, token: `${target}/640.avif token`, width: 640 },
          { path: `${target}/960.avif`, token: `${target}/960.avif token`, width: 960 },
        ],
        webp: [
          { path: `${target}/640.webp`, token: `${target}/640.webp token`, width: 640 },
          { path: `${target}/960.webp`, token: `${target}/960.webp token`, width: 960 },
        ],
      },
      version: image.version,
      width: 960,
    });
  });

  it("keeps the upload, so a request that fails later can be repeated", async () => {
    await publishUpload(uploadId, "folder");

    expect(storage.deleteFolder).not.toHaveBeenCalled();
  });

  it("returns 422 for an upload that does not exist or has expired", async () => {
    storage.readFile.mockResolvedValue(undefined);

    await expect(publishUpload(uploadId, "folder")).rejects.toBeInstanceOf(
      UnprocessableContentError,
    );
    expect(storage.copyFile).not.toHaveBeenCalled();
  });

  it("removes the copies made so far when a copy fails", async () => {
    storage.copyToDownloadableFile.mockRejectedValueOnce(new Error("Storage is down"));

    await expect(publishUpload(uploadId, "folder")).rejects.toThrow("Storage is down");

    expect(storage.deleteFolder).toHaveBeenCalledWith(
      expect.stringMatching(/^folder\/[0-9a-f-]{36}$/),
    );
  });
});

describe("deleteUploadsOrWarn", () => {
  it("deletes the folder of every upload and survives a failure", async () => {
    storage.deleteFolder.mockRejectedValueOnce(new Error("Storage is down"));

    await expect(deleteUploadsOrWarn(["a", "b"])).resolves.toBeUndefined();

    expect(storage.deleteFolder.mock.calls).toEqual([["uploads/a"], ["uploads/b"]]);
  });
});
