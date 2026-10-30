import type { Image } from "#shared/images/storage";

/** An image as the API returns it, for responses of mocked services. */
export function apiImage(fileName: string): Image {
  return {
    fileName,
    fileSize: 466_000,
    width: 960,
    height: 640,
    sources: {
      avif: [{ url: "https://storage.test/image/960.avif?token=token", width: 960 }],
      webp: [{ url: "https://storage.test/image/960.webp?token=token", width: 960 }],
    },
    version: "version",
  };
}
