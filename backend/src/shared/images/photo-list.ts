import { randomUUID } from "node:crypto";

import { z } from "zod";

import { UnprocessableContentError } from "#shared/http/errors";
import { altSchema, photoSchema, storedPhotoSchema, toPhoto } from "#shared/images/photo";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload, uploadIdSchema } from "#shared/images/uploads";

/** Stays the same when the file is replaced. */
const listPhotoIdSchema = z.uuid();

/** A photo of a list as stored in Firestore, in the array that keeps their order. */
export const storedListPhotoSchema = storedPhotoSchema.extend({
  id: listPhotoIdSchema,
});

/** A photo of a list, such as the process photos, as the API returns it. */
export const listPhotoSchema = photoSchema.extend({ id: listPhotoIdSchema });

/** One photo of the new list: a saved one by its id, a new file by its upload, or both to replace the file. */
const listPhotoItemSchema = z
  .strictObject({
    alt: altSchema,
    /** A saved photo; it keeps its id and its file unless `uploadId` replaces the file. */
    id: listPhotoIdSchema.optional(),
    /** The file of a new photo, or the new file of a saved one. */
    uploadId: uploadIdSchema.optional(),
  })
  .refine((item) => item.id !== undefined || item.uploadId !== undefined, {
    message: "A photo needs an id, an uploadId or both",
  });

function isDistinct(values: (string | undefined)[]): boolean {
  const defined = values.filter((value) => value !== undefined);

  return new Set(defined).size === defined.length;
}

/** The whole new list, in the order the site shows it; a saved photo left out is deleted. */
export function photoListBodySchema(maxPhotos: number) {
  return z
    .array(listPhotoItemSchema)
    .max(maxPhotos)
    .refine((items) => isDistinct(items.map((item) => item.id)), "Each id must appear once")
    .refine(
      (items) => isDistinct(items.map((item) => item.uploadId)),
      "Each uploadId must appear once",
    );
}

export type StoredListPhoto = z.infer<typeof storedListPhotoSchema>;
export type ListPhoto = z.infer<typeof listPhotoSchema>;
export type ListPhotoItem = z.infer<typeof listPhotoItemSchema>;

/** The stored photo as the API returns it, with download URLs. */
export function toListPhoto(photo: StoredListPhoto): ListPhoto {
  return { ...toPhoto(photo), id: photo.id };
}

/** A photo of the new list: the id it will have, and its new file, if any. */
interface PlannedPhoto {
  alt: string;
  id: string;
  /** False for a new photo, whose id is made here. */
  isSaved: boolean;
  uploadId: string | undefined;
}

/**
 * A new list whose files are already copied from their uploads, waiting to be saved. The caller
 * builds the list from the saved one inside its transaction, then either finishes or discards it.
 */
export interface PhotoListDraft {
  /** The new list from the saved one; rejects a saved photo that is not there with 422. */
  build(saved: StoredListPhoto[]): StoredListPhoto[];
  /** Removes the copied files, when the new list was not saved. */
  discard(): Promise<void>;
  /**
   * Once the new list is saved, removes the files it no longer uses (the deleted photos and the
   * replaced versions) and the used uploads.
   */
  finish(saved: StoredListPhoto[], photos: StoredListPhoto[]): Promise<void>;
}

function toPlannedPhoto({ alt, id, uploadId }: ListPhotoItem): PlannedPhoto {
  // A new photo gets its own id, so all its versions share one folder.
  return { alt, id: id ?? randomUUID(), isSaved: id !== undefined, uploadId };
}

/**
 * Copies the new files of `items` from their uploads into `folder`, one photo at a time: every
 * version of a photo lives under `{folder}/{photo id}`, so deleting the photo removes them all. If
 * copying fails, the copies made so far are removed.
 */
export async function preparePhotoList(
  items: ListPhotoItem[],
  folder: string,
): Promise<PhotoListDraft> {
  const planned = items.map(toPlannedPhoto);
  const images = new Map<string, StoredImage>();

  function photoFolder(id: string): string {
    return `${folder}/${id}`;
  }

  function versionFolder(id: string, version: string): string {
    return `${photoFolder(id)}/${version}`;
  }

  async function discard(): Promise<void> {
    await Promise.all(
      [...images].map(([id, image]) => deleteImageFilesOrWarn(versionFolder(id, image.version))),
    );
  }

  function build(saved: StoredListPhoto[]): StoredListPhoto[] {
    const savedById = new Map(saved.map((photo) => [photo.id, photo]));

    return planned.map(({ alt, id, isSaved }) => {
      const savedPhoto = savedById.get(id);

      if (isSaved && !savedPhoto) {
        throw new UnprocessableContentError(`There is no photo ${id}`);
      }

      const image = images.get(id) ?? savedPhoto;

      // The schema requires an upload for a new photo.
      if (!image) {
        throw new Error(`Photo ${id} has neither a saved file nor an upload`);
      }

      return { ...image, alt, id };
    });
  }

  async function finish(saved: StoredListPhoto[], photos: StoredListPhoto[]): Promise<void> {
    const keptIds = new Set(photos.map((photo) => photo.id));
    const unusedFolders = saved.flatMap((photo) => {
      if (!keptIds.has(photo.id)) {
        return [photoFolder(photo.id)];
      }

      return images.has(photo.id) ? [versionFolder(photo.id, photo.version)] : [];
    });

    await Promise.all([
      ...unusedFolders.map(deleteImageFilesOrWarn),
      deleteUploadsOrWarn(planned.flatMap((photo) => photo.uploadId ?? [])),
    ]);
  }

  try {
    for (const { id, uploadId } of planned) {
      if (uploadId) {
        images.set(id, await publishUpload(uploadId, photoFolder(id)));
      }
    }
  } catch (error) {
    await discard();
    throw error;
  }

  return { build, discard, finish };
}
