import { randomUUID } from "node:crypto";

import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";
import { warn as logWarning } from "firebase-functions/logger";
import { type ImageSource, type Photo, photoSchema } from "#schemas/contactPhoto";
import { contactsDocument } from "#services/contacts";
import { firestore } from "#shared/firebase/firestore";
import { deleteFolder, saveDownloadableFile, saveFile } from "#shared/firebase/storage";
import { NotFoundError } from "#shared/http/errors";
import {
  type EncodedImage,
  type OutputFormat,
  type ProcessedImage,
  processImage,
} from "#shared/images/processing";
import type { UploadedFile } from "#shared/middleware/upload";

// Every upload gets its own folder and therefore new URLs, so the files can be cached forever.
const immutableCacheControl = "public, max-age=31536000, immutable";

interface SavedImage {
  format: OutputFormat;
  source: ImageSource;
}

interface NewPhoto {
  alt: string;
  file: UploadedFile;
  processed: ProcessedImage;
  version: string;
}

type PhotoChange<T> = (
  photo: Photo | null,
  transaction: Transaction,
  document: DocumentReference,
) => T;

function photoFolder(version: string): string {
  return `contacts/photo/${version}`;
}

function readPhoto(snapshot: DocumentSnapshot): Photo | null {
  const photo: unknown = snapshot.get("photo");

  return photo === undefined ? null : photoSchema.parse(photo);
}

/**
 * Reads the photo and writes the change in one transaction: concurrent requests, such as a delete
 * and an alt update, would otherwise leave a broken photo behind.
 */
function changePhoto<T>(change: PhotoChange<T>): Promise<T> {
  return firestore().runTransaction(async (transaction) => {
    const document = contactsDocument();

    return change(readPhoto(await transaction.get(document)), transaction, document);
  });
}

async function saveImage(folder: string, image: EncodedImage): Promise<SavedImage> {
  const path = `${folder}/${String(image.width)}.${image.format}`;
  const url = await saveDownloadableFile(path, image.data, {
    cacheControl: immutableCacheControl,
    contentType: `image/${image.format}`,
  });

  return { format: image.format, source: { url, width: image.width } };
}

function sourcesIn(format: OutputFormat, images: SavedImage[]): ImageSource[] {
  return images.filter((image) => image.format === format).map((image) => image.source);
}

/**
 * Saves the web images and the original, which is kept to rebuild the images later, and returns
 * the photo that describes them.
 */
async function savePhotoFiles({ alt, file, processed, version }: NewPhoto): Promise<Photo> {
  const { images, sourceFormat } = processed;
  const largest = images.reduce((widest, current) =>
    current.width > widest.width ? current : widest,
  );
  const folder = photoFolder(version);

  const [savedImages] = await Promise.all([
    Promise.all(images.map((image) => saveImage(folder, image))),
    saveFile(`${folder}/original.${sourceFormat}`, file.data, {
      contentType: `image/${sourceFormat}`,
    }),
  ]);

  return {
    alt,
    fileName: file.name,
    fileSize: file.size,
    height: largest.height,
    sources: {
      avif: sourcesIn("avif", savedImages),
      webp: sourcesIn("webp", savedImages),
    },
    version,
    width: largest.width,
  };
}

/** Leftover files only take space, so a failed cleanup must not fail the request. */
async function deletePhotoFilesOrWarn(version: string): Promise<void> {
  await deleteFolder(photoFolder(version)).catch((error: unknown) => {
    logWarning("Could not delete contact photo files", { error, version });
  });
}

export async function getContactPhoto(): Promise<Photo | null> {
  return readPhoto(await contactsDocument().get());
}

/**
 * Stores the new photo before removing the previous one, so the site never links to missing
 * files. If storing fails halfway, the files saved so far are removed.
 */
export async function saveContactPhoto(file: UploadedFile, alt: string): Promise<Photo> {
  const processed = await processImage(file.data);
  const version = randomUUID();
  let photo: Photo;
  let previous: Photo | null;

  try {
    photo = await savePhotoFiles({ alt, file, processed, version });
    previous = await changePhoto((current, transaction, document) => {
      transaction.set(document, { photo }, { merge: true });
      return current;
    });
  } catch (error) {
    await deletePhotoFilesOrWarn(version);
    throw error;
  }

  if (previous) {
    await deletePhotoFilesOrWarn(previous.version);
  }

  return photo;
}

export function updateContactPhotoAlt(alt: string): Promise<Photo> {
  return changePhoto((photo, transaction, document) => {
    if (!photo) {
      throw new NotFoundError("There is no contact photo");
    }

    transaction.update(document, { "photo.alt": alt });
    return { ...photo, alt };
  });
}

export async function deleteContactPhoto(): Promise<void> {
  const deleted = await changePhoto((photo, transaction, document) => {
    if (photo) {
      transaction.update(document, { photo: FieldValue.delete() });
    }

    return photo;
  });

  if (deleted) {
    await deletePhotoFilesOrWarn(deleted.version);
  }
}
