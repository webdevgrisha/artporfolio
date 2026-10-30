import { randomUUID } from "node:crypto";

import type { DocumentReference, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import {
  maxProcessPhotos,
  type ProcessPhoto,
  type ProcessPhotoItem,
  type StoredProcessPhoto,
  storedProcessPhotoSchema,
} from "#modules/about/process-photos/schema";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { entityTag, matchesIfMatch } from "#shared/http/etag";
import { toPhoto } from "#shared/images/photo";
import { processImage } from "#shared/images/processing";
import { deleteImageFilesOrWarn, type StoredImage, saveImageFiles } from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload } from "#shared/images/uploads";
import type { UploadedFile } from "#shared/middleware/upload";

/** The field of the About document that holds the photos, in the order the site shows them. */
const field = "processPhotos";

const storedProcessPhotosSchema = z.array(storedProcessPhotoSchema);

/** The photos in their order, and the entity tag of the list for If-Match. */
export interface ProcessPhotoList {
  etag: string;
  processPhotos: ProcessPhoto[];
}

/** A photo of the new list: the id it will have, and its new file, if any. */
interface PlannedPhoto {
  alt: string;
  id: string;
  /** False for a new photo, whose id is made here. */
  isSaved: boolean;
  uploadId: string | undefined;
}

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

function toProcessPhotoList(photos: StoredProcessPhoto[]): ProcessPhotoList {
  // The tag follows the stored data, so any change of the list, by any request, changes it.
  return { etag: entityTag(photos), processPhotos: photos.map(toProcessPhoto) };
}

export async function listProcessPhotos(): Promise<ProcessPhotoList> {
  return toProcessPhotoList(await readCurrentPhotos());
}

function toPlannedPhoto({ alt, id, uploadId }: ProcessPhotoItem): PlannedPhoto {
  // A new photo gets its own id, so all its versions share one folder.
  return { alt, id: id ?? randomUUID(), isSaved: id !== undefined, uploadId };
}

/** Copies the new files from their uploads, one photo at a time; returns the images by photo id. */
async function publishFiles(planned: PlannedPhoto[]): Promise<Map<string, StoredImage>> {
  const images = new Map<string, StoredImage>();

  try {
    for (const { id, uploadId } of planned) {
      if (uploadId) {
        images.set(id, await publishUpload(uploadId, photoFolder(id)));
      }
    }
  } catch (error) {
    await deleteVersions(images);
    throw error;
  }

  return images;
}

async function deleteVersions(images: Map<string, StoredImage>): Promise<void> {
  await Promise.all(
    [...images].map(([id, image]) => deleteImageFilesOrWarn(versionFolder(id, image.version))),
  );
}

/** The new list from the saved one; rejects a saved photo that is not there. */
function buildPhotos(
  planned: PlannedPhoto[],
  saved: StoredProcessPhoto[],
  images: Map<string, StoredImage>,
): StoredProcessPhoto[] {
  const savedById = new Map(saved.map((photo) => [photo.id, photo]));

  return planned.map(({ alt, id, isSaved }) => {
    const savedPhoto = savedById.get(id);

    if (isSaved && !savedPhoto) {
      throw new UnprocessableContentError(`There is no process photo ${id}`);
    }

    const image = images.get(id) ?? savedPhoto;

    // The schema requires an upload for a new photo.
    if (!image) {
      throw new Error(`Process photo ${id} has neither a saved file nor an upload`);
    }

    return { ...image, alt, id };
  });
}

/** The files the new list no longer uses: deleted photos, and the replaced versions. */
async function deleteUnusedFiles(
  saved: StoredProcessPhoto[],
  photos: StoredProcessPhoto[],
  images: Map<string, StoredImage>,
): Promise<void> {
  const keptIds = new Set(photos.map((photo) => photo.id));
  const folders = saved.flatMap((photo) => {
    if (!keptIds.has(photo.id)) {
      return [photoFolder(photo.id)];
    }

    return images.has(photo.id) ? [versionFolder(photo.id, photo.version)] : [];
  });

  await Promise.all(folders.map(deleteImageFilesOrWarn));
}

/**
 * Replaces the whole list: the order of `items` is the order on the site, and a saved photo left
 * out is deleted. The new files are copied from their uploads first; then one transaction checks
 * that the list is still the one the client read (`ifMatch`) and writes the new one. The files of
 * the deleted photos and of the replaced versions, and the used uploads, are removed afterwards.
 * If anything fails, the copies are removed and the list stays as it was.
 */
export async function replaceProcessPhotos(
  items: ProcessPhotoItem[],
  ifMatch: string,
): Promise<ProcessPhotoList> {
  const planned = items.map(toPlannedPhoto);
  const images = await publishFiles(planned);
  let saved: StoredProcessPhoto[];
  let photos: StoredProcessPhoto[];

  try {
    [saved, photos] = await changePhotos((current, transaction, document) => {
      if (!matchesIfMatch(ifMatch, entityTag(current))) {
        throw new PreconditionFailedError("The process photos have changed since they were read");
      }

      const next = buildPhotos(planned, current, images);
      writePhotos(transaction, document, next);
      return [current, next];
    });
  } catch (error) {
    await deleteVersions(images);
    throw error;
  }

  await Promise.all([
    deleteUnusedFiles(saved, photos, images),
    deleteUploadsOrWarn(planned.flatMap((photo) => photo.uploadId ?? [])),
  ]);

  return toProcessPhotoList(photos);
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
