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
  /** The uploaded file, which only the admin can download; see modules/originals. */
  originalPath: z.string(),
  /** A preview of the image, a few pixels wide, as a data URL; see processing.ts. */
  placeholder: z.string(),
  sources: z.object({
    avif: z.array(storedImageFileSchema),
    webp: z.array(storedImageFileSchema),
  }),
  version: z.string(),
  width: z.number().int().positive(),
});

/** An image file as the API returns it, ready for a srcset. */
export interface ImageSource {
  /** The file never changes, so the download URL is cached for a year. */
  url: string;
  width: number;
}

/**
 * The image as the API returns it, with download URLs in place of the stored paths: resized
 * without cropping to the widths 320, 640, 960, 1280 and 1920 (never wider than the original) and
 * encoded as AVIF and WebP, each ordered by width.
 */
export interface Image {
  fileName: string;
  /** Size of the uploaded file, in bytes. */
  fileSize: number;
  /** Size of the largest image. */
  width: number;
  height: number;
  /** URL of the uploaded file, from the site's origin; only the admin can download it. */
  original: string;
  /**
   * A preview of the image 16px wide, as a `data:` URL of about 200 bytes: a page stretches and
   * blurs it in the place of the image while the image loads.
   */
  placeholder: string;
  sources: { avif: ImageSource[]; webp: ImageSource[] };
  /** Changes with every upload. */
  version: string;
}

export type StoredImageFile = z.infer<typeof storedImageFileSchema>;
export type StoredImage = z.infer<typeof storedImageSchema>;

function toImageSource({ path, token, width }: StoredImageFile): ImageSource {
  return { url: downloadUrl({ path, token }), width };
}

/** The route of modules/originals that serves the file at `path`. */
function originalUrl(path: string): string {
  return `/api/originals/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** The stored image as the API returns it, with download URLs. */
export function toImage({
  fileName,
  fileSize,
  height,
  originalPath,
  placeholder,
  sources,
  version,
  width,
}: StoredImage): Image {
  return {
    fileName,
    fileSize,
    height,
    original: originalUrl(originalPath),
    placeholder,
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
    // The error goes last, on its own: inside an object the logger would drop its message.
    logWarning(`Could not delete the image files in ${folder}`, error);
  });
}
