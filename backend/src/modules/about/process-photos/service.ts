import { randomUUID } from "node:crypto";

import type { DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { aboutDocument } from "#modules/about/document";
import {
  type ProcessPhoto,
  type ProcessPhotoItem,
  type StoredProcessPhoto,
  storedProcessPhotoSchema,
} from "#modules/about/process-photos/schema";
import { firestore } from "#shared/firebase/firestore";
import { PreconditionFailedError, UnprocessableContentError } from "#shared/http/errors";
import { entityTag, matchesIfMatch } from "#shared/http/etag";
import { toPhoto } from "#shared/images/photo";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload } from "#shared/images/uploads";

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

function toProcessPhotoList(photos: StoredProcessPhoto[]): ProcessPhotoList {
  // The tag follows the stored data, so any change of the list, by any request, changes it.
  return { etag: entityTag(photos), processPhotos: photos.map(toProcessPhoto) };
}

export async function listProcessPhotos(): Promise<ProcessPhotoList> {
  return toProcessPhotoList(readProcessPhotos(await aboutDocument().get()));
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
    [saved, photos] = await firestore().runTransaction(async (transaction) => {
      const document = aboutDocument();
      const current = readProcessPhotos(await transaction.get(document));

      if (!matchesIfMatch(ifMatch, entityTag(current))) {
        throw new PreconditionFailedError("The process photos have changed since they were read");
      }

      const next = buildPhotos(planned, current, images);
      // Merging keeps the other fields of the document; the array itself is replaced.
      transaction.set(document, { [field]: next }, { merge: true });
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
