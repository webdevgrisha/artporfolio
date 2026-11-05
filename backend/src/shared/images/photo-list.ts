import { randomUUID } from "node:crypto";

import { z } from "zod";

import { UnprocessableContentError } from "#shared/http/errors";
import { altSchema, type Photo, storedPhotoSchema, toPhoto } from "#shared/images/photo";
import type { ImageFiles } from "#shared/images/saving";
import type { StoredImage } from "#shared/images/stored-image";
import { uploadIdSchema } from "#shared/images/uploads";

/** Stays the same when the file is replaced. */
const listPhotoIdSchema = z.uuid();

/** A photo of a list as stored in Firestore, in the array that keeps their order. */
export const storedListPhotoSchema = storedPhotoSchema.extend({
  id: listPhotoIdSchema,
});

/** A photo of a list, such as the process photos, as the API returns it. */
export interface ListPhoto extends Photo {
  id: string;
}

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

/** A new list whose files are already copied from their uploads, waiting to be saved. */
export interface PhotoListDraft {
  /** The new list from the saved one; rejects a saved photo that is not there with 422. */
  build(saved: StoredListPhoto[]): StoredListPhoto[];
  /** Once the list is saved, names the files it no longer uses: deleted photos, replaced versions. */
  removeUnused(saved: StoredListPhoto[], photos: StoredListPhoto[]): void;
}

function toPlannedPhoto({ alt, id, uploadId }: ListPhotoItem): PlannedPhoto {
  // A new photo gets its own id, so all its versions share one folder.
  return { alt, id: id ?? randomUUID(), isSaved: id !== undefined, uploadId };
}

/**
 * Copies the new files of `items` from their uploads into `folder`, one photo at a time: every
 * version of a photo lives under `{folder}/{photo id}`, so deleting the photo removes them all.
 */
export async function preparePhotoList(
  files: ImageFiles,
  items: ListPhotoItem[],
  folder: string,
): Promise<PhotoListDraft> {
  const planned = items.map(toPlannedPhoto);
  const images = new Map<string, StoredImage>();

  function photoFolder(id: string): string {
    return `${folder}/${id}`;
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

  function removeUnused(saved: StoredListPhoto[], photos: StoredListPhoto[]): void {
    const keptIds = new Set(photos.map((photo) => photo.id));

    for (const photo of saved) {
      if (!keptIds.has(photo.id)) {
        files.removeAfterSave(photoFolder(photo.id));
      } else if (images.has(photo.id)) {
        files.removeAfterSave(`${photoFolder(photo.id)}/${photo.version}`);
      }
    }
  }

  for (const { id, uploadId } of planned) {
    if (uploadId) {
      images.set(id, await files.publish(uploadId, photoFolder(id)));
    }
  }

  return { build, removeUnused };
}
