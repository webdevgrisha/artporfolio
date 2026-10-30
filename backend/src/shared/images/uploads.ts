import { randomUUID } from "node:crypto";

import { z } from "zod";

import { copyFile, copyToDownloadableFile, readFile, saveFile } from "#shared/firebase/storage";
import { UnprocessableContentError } from "#shared/http/errors";
import {
  type OutputFormat,
  outputFormats,
  processImage,
  type SourceFormat,
  sourceFormats,
} from "#shared/images/processing";
import {
  deleteImageFilesOrWarn,
  immutableCacheControl,
  type StoredImage,
  type StoredImageFile,
} from "#shared/images/storage";
import type { UploadedFile } from "#shared/middleware/upload";

/**
 * Uploads wait here until a request puts them into the content. The bucket deletes them a day
 * after they were made (storage.lifecycle.json), so an upload that is never used leaves nothing.
 */
const uploadsFolder = "uploads";

const manifestName = "upload.json";

/** Identifies an upload in the requests that use it. */
export const uploadIdSchema = z.uuid();

/** What an upload holds, saved next to its files. */
const manifestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  height: z.number().int().positive(),
  /** The web images, one file per width in every format. */
  images: z.array(
    z.object({
      format: z.enum(outputFormats),
      width: z.number().int().positive(),
    }),
  ),
  sourceFormat: z.enum(sourceFormats),
  width: z.number().int().positive(),
});

type Manifest = z.infer<typeof manifestSchema>;

interface PublishedImageFile {
  file: StoredImageFile;
  format: OutputFormat;
}

function uploadFolder(id: string): string {
  return `${uploadsFolder}/${id}`;
}

function imageFileName({ format, width }: { format: OutputFormat; width: number }): string {
  return `${String(width)}.${format}`;
}

function originalFileName(format: SourceFormat): string {
  return `original.${format}`;
}

/**
 * Waits for every write, even after one has failed: the caller then deletes the folder, and a
 * write still running would add a file to it afterwards.
 */
async function writeAll(writes: Promise<unknown>[]): Promise<void> {
  const results = await Promise.allSettled(writes);
  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    throw failure.reason;
  }
}

/**
 * Turns an uploaded photo into web images and keeps them, with the original, until a request uses
 * them. Returns the id of the upload. If storing fails halfway, the files saved so far are removed.
 */
export async function saveUpload(file: UploadedFile): Promise<string> {
  const { images, sourceFormat } = await processImage(file.data);
  const largest = images.reduce((widest, current) =>
    current.width > widest.width ? current : widest,
  );
  const manifest: Manifest = {
    fileName: file.name,
    fileSize: file.size,
    height: largest.height,
    images: images.map(({ format, width }) => ({ format, width })),
    sourceFormat,
    width: largest.width,
  };
  const id = randomUUID();
  const folder = uploadFolder(id);

  try {
    await writeAll([
      ...images.map((image) =>
        saveFile(`${folder}/${imageFileName(image)}`, image.data, {
          contentType: `image/${image.format}`,
        }),
      ),
      saveFile(`${folder}/${originalFileName(sourceFormat)}`, file.data, {
        contentType: `image/${sourceFormat}`,
      }),
    ]);
    // Written last: an upload is complete once its manifest exists.
    await saveFile(`${folder}/${manifestName}`, Buffer.from(JSON.stringify(manifest)), {
      contentType: "application/json",
    });
  } catch (error) {
    await deleteImageFilesOrWarn(folder);
    throw error;
  }

  return id;
}

async function readManifest(id: string): Promise<Manifest> {
  const data = await readFile(`${uploadFolder(id)}/${manifestName}`);

  if (!data) {
    throw new UnprocessableContentError(`There is no upload ${id}; uploads expire after a day`);
  }

  return manifestSchema.parse(JSON.parse(data.toString("utf8")));
}

function filesIn(format: OutputFormat, published: PublishedImageFile[]): StoredImageFile[] {
  return published.filter((entry) => entry.format === format).map((entry) => entry.file);
}

/**
 * Copies the upload into a new version folder under `folder`, where the site reads it: the web
 * images become readable through download URLs, the original stays private. The upload itself is
 * kept, so a request that fails afterwards can be repeated; see deleteUploadsOrWarn. If copying
 * fails halfway, the copies made so far are removed.
 */
export async function publishUpload(id: string, folder: string): Promise<StoredImage> {
  const manifest = await readManifest(id);
  const source = uploadFolder(id);
  const version = randomUUID();
  const target = `${folder}/${version}`;
  const original = originalFileName(manifest.sourceFormat);

  const copyingOriginal = copyFile(`${source}/${original}`, `${target}/${original}`, {
    contentType: `image/${manifest.sourceFormat}`,
  });
  const copyingImages = manifest.images.map(async (image): Promise<PublishedImageFile> => {
    const name = imageFileName(image);
    const file = await copyToDownloadableFile(`${source}/${name}`, `${target}/${name}`, {
      cacheControl: immutableCacheControl,
      contentType: `image/${image.format}`,
    });

    return { file: { ...file, width: image.width }, format: image.format };
  });

  try {
    await writeAll([copyingOriginal, ...copyingImages]);
  } catch (error) {
    await deleteImageFilesOrWarn(target);
    throw error;
  }

  const published = await Promise.all(copyingImages);

  return {
    fileName: manifest.fileName,
    fileSize: manifest.fileSize,
    height: manifest.height,
    sources: {
      avif: filesIn("avif", published),
      webp: filesIn("webp", published),
    },
    version,
    width: manifest.width,
  };
}

/** Uploads only take space until the bucket deletes them, so a failed cleanup is only logged. */
export async function deleteUploadsOrWarn(ids: readonly string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteImageFilesOrWarn(uploadFolder(id))));
}
