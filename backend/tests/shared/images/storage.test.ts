import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  deleteFolder: vi.fn(),
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("#shared/firebase/storage", () => storage);
vi.mock("firebase-functions/logger", () => logger);

import { deleteImageFilesOrWarn, toImage } from "#shared/images/storage";

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
});

describe("image storage", () => {
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
