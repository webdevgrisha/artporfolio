import { warn as logWarning } from "firebase-functions/logger";
import { z } from "zod";

import {
  deleteFolder,
  downloadUrl,
  saveDownloadableFile,
  saveFile,
} from "#shared/firebase/storage";
import type { EncodedImage, OutputFormat, ProcessedImage } from "#shared/images/processing";
import type { UploadedFile } from "#shared/middleware/upload";

// Every upload gets its own folder and therefore new URLs, so the files can be cached forever.
const immutableCacheControl = "public, max-age=31536000, immutable";

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

export type StoredImageFile = z.infer<typeof storedImageFileSchema>;
export type StoredImage = z.infer<typeof storedImageSchema>;

/** An image file as the API returns it, ready for a srcset. */
export interface ImageSource {
  url: string;
  width: number;
}

/** The image as the API returns it, with download URLs in place of the stored paths. */
export interface Image extends Omit<StoredImage, "sources"> {
  sources: { avif: ImageSource[]; webp: ImageSource[] };
}

/** A processed upload and the folder to store it in; the version identifies the image. */
interface NewImage {
  file: UploadedFile;
  folder: string;
  processed: ProcessedImage;
  version: string;
}

interface SavedImageFile {
  file: StoredImageFile;
  format: OutputFormat;
}

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

async function saveImageFile(folder: string, image: EncodedImage): Promise<SavedImageFile> {
  const path = `${folder}/${String(image.width)}.${image.format}`;
  const file = await saveDownloadableFile(path, image.data, {
    cacheControl: immutableCacheControl,
    contentType: `image/${image.format}`,
  });

  return { file: { ...file, width: image.width }, format: image.format };
}

function filesIn(format: OutputFormat, saved: SavedImageFile[]): StoredImageFile[] {
  return saved.filter((entry) => entry.format === format).map((entry) => entry.file);
}

/**
 * Saves the web images and the original, which is kept to rebuild the images later, and returns
 * the image that describes them.
 */
export async function saveImageFiles({
  file,
  folder,
  processed,
  version,
}: NewImage): Promise<StoredImage> {
  const { images, sourceFormat } = processed;
  const largest = images.reduce((widest, current) =>
    current.width > widest.width ? current : widest,
  );

  const [savedFiles] = await Promise.all([
    Promise.all(images.map((image) => saveImageFile(folder, image))),
    saveFile(`${folder}/original.${sourceFormat}`, file.data, {
      contentType: `image/${sourceFormat}`,
    }),
  ]);

  return {
    fileName: file.name,
    fileSize: file.size,
    height: largest.height,
    sources: {
      avif: filesIn("avif", savedFiles),
      webp: filesIn("webp", savedFiles),
    },
    version,
    width: largest.width,
  };
}

/** Leftover files only take space, so a failed cleanup must not fail the request. */
export async function deleteImageFilesOrWarn(folder: string): Promise<void> {
  await deleteFolder(folder).catch((error: unknown) => {
    logWarning("Could not delete image files", { error, folder });
  });
}
