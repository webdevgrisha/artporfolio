import { randomUUID } from "node:crypto";

import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";
import { z } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";
import { processImage } from "#shared/images/processing";
import {
  deleteImageFilesOrWarn,
  imageSchema,
  saveImageFiles,
  storedImageSchema,
  toImage,
} from "#shared/images/storage";
import type { UploadedFile } from "#shared/middleware/upload";

/** The text alternative of a photo. */
export const altSchema = z.string().trim().min(1).max(250);

/** Text fields sent with a photo file, and the body of an alt text update. */
export const photoAltBodySchema = z
  .object({
    alt: altSchema,
  })
  .strict();

/**
 * A photo as stored in Firestore: the uploaded image and its alt text. The alt text rules apply
 * when it is saved, so tightening them later never makes a saved photo unreadable.
 */
export const storedPhotoSchema = storedImageSchema.extend({
  alt: z.string(),
});

/**
 * A photo as the API returns it, with download URLs in place of the stored paths. The alt text is
 * returned as it was saved, even if the rules have changed since.
 */
export const photoSchema = imageSchema.extend({ alt: z.string() });

export const photoResponseSchema = z.object({ photo: photoSchema });

export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotoResponse = z.infer<typeof photoResponseSchema>;

/**
 * Where a single photo is kept: a field of a Firestore document, and a Storage folder with one
 * subfolder per uploaded version.
 */
export interface PhotoSlot {
  document: () => DocumentReference;
  field: string;
  folder: string;
}

/** The saved photo, and whether it is the first one rather than a replacement. */
export interface SavedPhoto {
  created: boolean;
  photo: Photo;
}

type PhotoChange<T> = (
  photo: StoredPhoto | null,
  transaction: Transaction,
  document: DocumentReference,
) => T;

function versionFolder(slot: PhotoSlot, version: string): string {
  return `${slot.folder}/${version}`;
}

export function readPhoto(snapshot: DocumentSnapshot, field: string): StoredPhoto | null {
  const photo: unknown = snapshot.get(field);

  return photo === undefined ? null : storedPhotoSchema.parse(photo);
}

/** The stored photo as the API returns it, with download URLs. */
export function toPhoto(photo: StoredPhoto): Photo {
  return { ...toImage(photo), alt: photo.alt };
}

/**
 * Reads the photo and writes the change in one transaction: concurrent requests, such as a delete
 * and an alt update, would otherwise leave a broken photo behind.
 */
function changePhoto<T>(slot: PhotoSlot, change: PhotoChange<T>): Promise<T> {
  return firestore().runTransaction(async (transaction) => {
    const document = slot.document();

    return change(readPhoto(await transaction.get(document), slot.field), transaction, document);
  });
}

/**
 * Stores the new photo before removing the previous one, so the site never links to missing
 * files. If storing fails halfway, the files saved so far are removed.
 */
export async function savePhoto(
  slot: PhotoSlot,
  file: UploadedFile,
  alt: string,
): Promise<SavedPhoto> {
  const processed = await processImage(file.data);
  const version = randomUUID();
  const folder = versionFolder(slot, version);
  let photo: StoredPhoto;
  let previous: StoredPhoto | null;

  try {
    const image = await saveImageFiles({ file, folder, processed, version });
    photo = { ...image, alt };
    previous = await changePhoto(slot, (current, transaction, document) => {
      // Merging keeps the other fields of the document.
      transaction.set(document, { [slot.field]: photo }, { merge: true });
      return current;
    });
  } catch (error) {
    await deleteImageFilesOrWarn(folder);
    throw error;
  }

  if (previous) {
    await deleteImageFilesOrWarn(versionFolder(slot, previous.version));
  }

  return { created: previous === null, photo: toPhoto(photo) };
}

export function updatePhotoAlt(slot: PhotoSlot, alt: string): Promise<Photo> {
  return changePhoto(slot, (photo, transaction, document) => {
    if (!photo) {
      throw new NotFoundError("There is no photo");
    }

    transaction.update(document, { [`${slot.field}.alt`]: alt });
    return toPhoto({ ...photo, alt });
  });
}

export async function deletePhoto(slot: PhotoSlot): Promise<void> {
  const deleted = await changePhoto(slot, (photo, transaction, document) => {
    if (photo) {
      transaction.update(document, { [slot.field]: FieldValue.delete() });
    }

    return photo;
  });

  if (deleted) {
    await deleteImageFilesOrWarn(versionFolder(slot, deleted.version));
  }
}
