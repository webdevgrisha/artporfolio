import { randomUUID } from "node:crypto";

import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import { type Photo, type StoredPhoto, storedPhotoSchema } from "#modules/contacts/photo/schema";
import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";
import { processImage } from "#shared/images/processing";
import { deleteImageFilesOrWarn, saveImageFiles, toImage } from "#shared/images/storage";
import type { UploadedFile } from "#shared/middleware/upload";

type PhotoChange<T> = (
  photo: StoredPhoto | null,
  transaction: Transaction,
  document: DocumentReference,
) => T;

function photoFolder(version: string): string {
  return `contacts/photo/${version}`;
}

function readPhoto(snapshot: DocumentSnapshot): StoredPhoto | null {
  const photo: unknown = snapshot.get("photo");

  return photo === undefined ? null : storedPhotoSchema.parse(photo);
}

/** The stored photo as the API returns it, with download URLs. */
function toPhoto(photo: StoredPhoto): Photo {
  return { ...toImage(photo), alt: photo.alt };
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

export async function getContactPhoto(): Promise<Photo | null> {
  const photo = readPhoto(await contactsDocument().get());

  return photo && toPhoto(photo);
}

/** The saved photo, and whether it is the first one rather than a replacement. */
export interface SavedPhoto {
  created: boolean;
  photo: Photo;
}

/**
 * Stores the new photo before removing the previous one, so the site never links to missing
 * files. If storing fails halfway, the files saved so far are removed.
 */
export async function saveContactPhoto(file: UploadedFile, alt: string): Promise<SavedPhoto> {
  const processed = await processImage(file.data);
  const version = randomUUID();
  let photo: StoredPhoto;
  let previous: StoredPhoto | null;

  try {
    const image = await saveImageFiles({ file, folder: photoFolder(version), processed, version });
    photo = { ...image, alt };
    previous = await changePhoto((current, transaction, document) => {
      transaction.set(document, { photo }, { merge: true });
      return current;
    });
  } catch (error) {
    await deleteImageFilesOrWarn(photoFolder(version));
    throw error;
  }

  if (previous) {
    await deleteImageFilesOrWarn(photoFolder(previous.version));
  }

  return { created: previous === null, photo: toPhoto(photo) };
}

export function updateContactPhotoAlt(alt: string): Promise<Photo> {
  return changePhoto((photo, transaction, document) => {
    if (!photo) {
      throw new NotFoundError("There is no contact photo");
    }

    transaction.update(document, { "photo.alt": alt });
    return toPhoto({ ...photo, alt });
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
    await deleteImageFilesOrWarn(photoFolder(deleted.version));
  }
}
