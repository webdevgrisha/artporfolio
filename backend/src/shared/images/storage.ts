import { warn as logWarning } from "firebase-functions/logger";
import { z } from "zod";

import { deleteFolder, downloadUrl } from "#shared/firebase/storage";

// Every saved image gets its own version folder and therefore new URLs, so the files can be cached
// forever.
export const immutableCacheControl = "public, max-age=31536000, immutable";

/** One encoded file in Cloud Storage; its download URL is built from the path and token. */
const storedImageFileSchema = z.object({
  path: z.string(),
  token: z.string(),
  width: z.number().int().positive(),
});

/** An uploaded image as stored in Firestore: one file per width in every format. */
export const storedImageSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  height: z.number().int().positive(),
  sources: z.object({
    avif: z.array(storedImageFileSchema),
    webp: z.array(storedImageFileSchema),
  }),
  version: z.string(),
  width: z.number().int().positive(),
});

/** An image file as the API returns it, ready for a srcset. */
const imageSourceSchema = z.object({
  /** The file never changes, so the download URL is cached for a year. */
  url: z.url(),
  width: z.number().int().positive(),
});

/**
 * The image as the API returns it, with download URLs in place of the stored paths: resized
 * without cropping to the widths 640, 960, 1280 and 1920 (never wider than the original) and
 * encoded as AVIF and WebP, each ordered by width.
 */
export const imageSchema = z.object({
  fileName: z.string(),
  /** Size of the uploaded file, in bytes. */
  fileSize: z.number().int().positive(),
  /** Size of the largest image. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sources: z.object({ avif: z.array(imageSourceSchema), webp: z.array(imageSourceSchema) }),
  /** Changes with every upload. */
  version: z.string(),
});

export type StoredImageFile = z.infer<typeof storedImageFileSchema>;
export type StoredImage = z.infer<typeof storedImageSchema>;
export type ImageSource = z.infer<typeof imageSourceSchema>;
export type Image = z.infer<typeof imageSchema>;

function toImageSource({ path, token, width }: StoredImageFile): ImageSource {
  return { url: downloadUrl({ path, token }), width };
}

/** The stored image as the API returns it, with download URLs. */
export function toImage({
  fileName,
  fileSize,
  height,
  sources,
  version,
  width,
}: StoredImage): Image {
  return {
    fileName,
    fileSize,
    height,
    sources: {
      avif: sources.avif.map(toImageSource),
      webp: sources.webp.map(toImageSource),
    },
    version,
    width,
  };
}

/** Leftover files only take space, so a failed cleanup must not fail the request. */
export async function deleteImageFilesOrWarn(folder: string): Promise<void> {
  await deleteFolder(folder).catch((error: unknown) => {
    logWarning("Could not delete image files", { error, folder });
  });
}
