import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
  saveDownloadableFile: vi.fn(),
  saveFile: vi.fn(),
}));

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("#shared/firebase/storage", () => storage);
vi.mock("firebase-functions/logger", () => logger);

import {
  deleteImageFilesOrWarn,
  saveImageFiles,
  storedImageSchema,
  toImage,
} from "#shared/images/storage";

const upload = { data: Buffer.from("original"), name: "photo.png", size: 8 };

function encoded(format: "avif" | "webp", width: number) {
  return { data: Buffer.from(`${format} ${String(width)}`), format, height: width / 2, width };
}

const processed = {
  images: [encoded("avif", 640), encoded("webp", 640), encoded("avif", 960), encoded("webp", 960)],
  sourceFormat: "png" as const,
};

const newImage = { file: upload, folder: "images/v1", processed, version: "v1" };

const storedImage = {
  fileName: "photo.png",
  fileSize: 8,
  height: 480,
  sources: {
    avif: [{ path: "images/v1/960.avif", token: "avif-token", width: 960 }],
    webp: [{ path: "images/v1/960.webp", token: "webp-token", width: 960 }],
  },
  version: "v1",
  width: 960,
};

beforeEach(() => {
  vi.clearAllMocks();
  storage.deleteFolder.mockResolvedValue(undefined);
  storage.saveDownloadableFile.mockImplementation(async (path: string) => ({
    path,
    token: `${path} token`,
  }));
  storage.saveFile.mockResolvedValue(undefined);
});

describe("image storage", () => {
  it("saves every web image as a public file that can be cached forever", async () => {
    await saveImageFiles(newImage);

    expect(storage.saveDownloadableFile).toHaveBeenCalledTimes(4);
    expect(storage.saveDownloadableFile).toHaveBeenCalledWith(
      "images/v1/960.webp",
      Buffer.from("webp 960"),
      {
        cacheControl: "public, max-age=31536000, immutable",
        contentType: "image/webp",
      },
    );
  });

  it("keeps the original privately", async () => {
    await saveImageFiles(newImage);

    expect(storage.saveFile).toHaveBeenCalledWith("images/v1/original.png", upload.data, {
      contentType: "image/png",
    });
  });

  it("describes the upload, the saved files and the size of the largest image", async () => {
    const image = await saveImageFiles(newImage);

    expect(image).toEqual({
      fileName: "photo.png",
      fileSize: 8,
      height: 480,
      sources: {
        avif: [
          { path: "images/v1/640.avif", token: "images/v1/640.avif token", width: 640 },
          { path: "images/v1/960.avif", token: "images/v1/960.avif token", width: 960 },
        ],
        webp: [
          { path: "images/v1/640.webp", token: "images/v1/640.webp token", width: 640 },
          { path: "images/v1/960.webp", token: "images/v1/960.webp token", width: 960 },
        ],
      },
      version: "v1",
      width: 960,
    });
    expect(storedImageSchema.safeParse(image).success).toBe(true);
  });

  it("fails only after every write has ended, so no file is added after the cleanup", async () => {
    const error = new Error("Storage is unavailable");
    const finishSlowWrites: (() => void)[] = [];
    storage.saveFile.mockRejectedValue(error);
    storage.saveDownloadableFile.mockImplementation(
      (path: string) =>
        new Promise((resolve) => {
          finishSlowWrites.push(() => resolve({ path, token: "token" }));
        }),
    );
    let failed = false;
    const saving = saveImageFiles(newImage).catch((reason: unknown) => {
      failed = true;
      return reason;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(failed).toBe(false);

    for (const finish of finishSlowWrites) finish();

    await expect(saving).resolves.toBe(error);
  });

  it("returns the image with download URLs in place of the stored paths", () => {
    expect(toImage(storedImage)).toEqual({
      ...storedImage,
      sources: {
        avif: [{ url: "https://storage.test/images/v1/960.avif?token=avif-token", width: 960 }],
        webp: [{ url: "https://storage.test/images/v1/960.webp?token=webp-token", width: 960 }],
      },
    });
  });

  it("returns only the fields of the image", () => {
    const storedPhoto = { ...storedImage, alt: "Portrait" };

    expect(toImage(storedPhoto)).not.toHaveProperty("alt");
  });

  it("deletes the folder of the image", async () => {
    await deleteImageFilesOrWarn("images/v1");

    expect(storage.deleteFolder).toHaveBeenCalledWith("images/v1");
  });

  it("only warns when the files cannot be deleted", async () => {
    storage.deleteFolder.mockRejectedValue(new Error("Storage is unavailable"));

    await expect(deleteImageFilesOrWarn("images/v1")).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      "Could not delete image files",
      expect.objectContaining({ folder: "images/v1" }),
    );
  });
});
