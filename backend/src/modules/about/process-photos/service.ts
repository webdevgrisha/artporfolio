import { randomUUID } from "node:crypto";

import type { DocumentReference, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import {
  maxProcessPhotos,
  type ProcessPhoto,
  type StoredProcessPhoto,
  storedProcessPhotoSchema,
} from "#modules/about/process-photos/schema";
import { firestore } from "#shared/firebase/firestore";
import { ConflictError, NotFoundError } from "#shared/http/errors";
import { toPhoto } from "#shared/images/photo";
import { processImage } from "#shared/images/processing";
import { deleteImageFilesOrWarn, saveImageFiles } from "#shared/images/storage";
import type { UploadedFile } from "#shared/middleware/upload";

/** The field of the About document that holds the photos, in the order the site shows them. */
const field = "processPhotos";

const storedProcessPhotosSchema = z.array(storedProcessPhotoSchema);

type PhotosChange<T> = (
  photos: StoredProcessPhoto[],
  transaction: Transaction,
  document: DocumentReference,
) => T;

/** Every version of one photo lives under its id, so deleting the photo removes them all. */
function photoFolder(id: string): string {
  return `about/process-photos/${id}`;
}

function versionFolder(id: string, version: string): string {
  return `${photoFolder(id)}/${version}`;
}

export function readProcessPhotos(snapshot: DocumentSnapshot): StoredProcessPhoto[] {
  const photos: unknown = snapshot.get(field);

  return photos === undefined ? [] : storedProcessPhotosSchema.parse(photos);
}

/** The stored photo as the API returns it, with download URLs. */
export function toProcessPhoto(photo: StoredProcessPhoto): ProcessPhoto {
  return { ...toPhoto(photo), id: photo.id };
}

function findPhoto(photos: StoredProcessPhoto[], id: string): StoredProcessPhoto {
  const photo = photos.find((candidate) => candidate.id === id);

  if (!photo) {
    throw new NotFoundError("There is no process photo with this id");
  }

  return photo;
}

function writePhotos(
  transaction: Transaction,
  document: DocumentReference,
  photos: StoredProcessPhoto[],
): void {
  // Merging keeps the other fields of the document; the array itself is replaced.
  transaction.set(document, { [field]: photos }, { merge: true });
}

/**
 * Reads the photos and writes the change in one transaction: every change rewrites the array, so
 * concurrent requests would otherwise lose each other's changes.
 */
function changePhotos<T>(change: PhotosChange<T>): Promise<T> {
  return firestore().runTransaction(async (transaction) => {
    const document = aboutDocument();

    return change(readProcessPhotos(await transaction.get(document)), transaction, document);
  });
}

async function readCurrentPhotos(): Promise<StoredProcessPhoto[]> {
  return readProcessPhotos(await aboutDocument().get());
}

export async function listProcessPhotos(): Promise<ProcessPhoto[]> {
  return (await readCurrentPhotos()).map(toProcessPhoto);
}

export async function getProcessPhoto(id: string): Promise<ProcessPhoto> {
  return toProcessPhoto(findPhoto(await readCurrentPhotos(), id));
}

/**
 * Adds the photo after the others. If storing fails halfway, or the list is full, the files saved
 * so far are removed.
 */
export async function addProcessPhoto(file: UploadedFile, alt: string): Promise<ProcessPhoto> {
  const processed = await processImage(file.data);
  const id = randomUUID();
  const version = randomUUID();
  let photo: StoredProcessPhoto;

  try {
    const image = await saveImageFiles({
      file,
      folder: versionFolder(id, version),
      processed,
      version,
    });
    photo = { ...image, alt, id };
    await changePhotos((photos, transaction, document) => {
      if (photos.length >= maxProcessPhotos) {
        throw new ConflictError(`The page already has ${String(maxProcessPhotos)} process photos`);
      }

      writePhotos(transaction, document, [...photos, photo]);
    });
  } catch (error) {
    await deleteImageFilesOrWarn(photoFolder(id));
    throw error;
  }

  return toProcessPhoto(photo);
}

/**
 * Replaces the file and the alt text; the id and the position stay. The new version is stored
 * before the previous one is removed, so the site never links to missing files. If storing fails
 * halfway, or there is no such photo, the new files are removed.
 */
export async function replaceProcessPhoto(
  id: string,
  file: UploadedFile,
  alt: string,
): Promise<ProcessPhoto> {
  const processed = await processImage(file.data);
  const version = randomUUID();
  const folder = versionFolder(id, version);
  let photo: StoredProcessPhoto;
  let previous: StoredProcessPhoto;

  try {
    const image = await saveImageFiles({ file, folder, processed, version });
    photo = { ...image, alt, id };
    previous = await changePhotos((photos, transaction, document) => {
      const current = findPhoto(photos, id);

      writePhotos(
        transaction,
        document,
        photos.map((candidate) => (candidate.id === id ? photo : candidate)),
      );
      return current;
    });
  } catch (error) {
    await deleteImageFilesOrWarn(folder);
    throw error;
  }

  await deleteImageFilesOrWarn(versionFolder(id, previous.version));

  return toProcessPhoto(photo);
}

export function updateProcessPhotoAlt(id: string, alt: string): Promise<ProcessPhoto> {
  return changePhotos((photos, transaction, document) => {
    const photo = { ...findPhoto(photos, id), alt };

    writePhotos(
      transaction,
      document,
      photos.map((candidate) => (candidate.id === id ? photo : candidate)),
    );
    return toProcessPhoto(photo);
  });
}

export async function deleteProcessPhoto(id: string): Promise<void> {
  await changePhotos((photos, transaction, document) => {
    findPhoto(photos, id);
    writePhotos(
      transaction,
      document,
      photos.filter((candidate) => candidate.id !== id),
    );
  });

  await deleteImageFilesOrWarn(photoFolder(id));
}

export async function getProcessPhotoOrder(): Promise<string[]> {
  return (await readCurrentPhotos()).map((photo) => photo.id);
}

/**
 * Puts the photos in the given order. The ids must name every photo exactly once: a list read
 * before another admin request added or deleted a photo is rejected rather than applied.
 */
export function reorderProcessPhotos(ids: string[]): Promise<string[]> {
  return changePhotos((photos, transaction, document) => {
    const byId = new Map(photos.map((photo) => [photo.id, photo]));
    const reordered = ids.flatMap((id) => byId.get(id) ?? []);
    const everyIdKnown = reordered.length === ids.length;

    // The ids are distinct, so known ids as many as the photos name every photo once.
    if (!everyIdKnown || ids.length !== photos.length) {
      throw new ConflictError("The ids must name every process photo once");
    }

    writePhotos(transaction, document, reordered);
    return ids;
  });
}
