import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { NotFoundError } from "#shared/http/errors";
import { changeSlot, clearSlot, fillSlot, type ImageSlot, readSlot } from "#shared/images/slot";
import { imageSchema, storedImageSchema, toImage } from "#shared/images/storage";
import { uploadIdSchema } from "#shared/images/uploads";

/** The text alternative of a photo. */
export const altSchema = z.string().trim().min(1).max(250);

/** A new photo: the file uploaded before (see uploads.ts) and its alt text. */
export const photoBodySchema = z.strictObject({
  alt: altSchema,
  uploadId: uploadIdSchema,
});

/** An update of the alt text alone. */
export const photoAltBodySchema = z.strictObject({
  alt: altSchema,
});

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

export type PhotoBody = z.infer<typeof photoBodySchema>;
export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotoResponse = z.infer<typeof photoResponseSchema>;

/** A single photo with its alt text, such as «My photo» or the contact photo. */
export type PhotoSlot = ImageSlot<StoredPhoto>;

/** The saved photo, and whether it is the first one rather than a replacement. */
export interface SavedPhoto {
  created: boolean;
  photo: Photo;
}

/** A photo slot in a field of `document`, with its versions in the Storage folder `folder`. */
export function photoSlot(place: {
  document: () => DocumentReference;
  field: string;
  folder: string;
}): PhotoSlot {
  return { ...place, schema: storedPhotoSchema };
}

export function readPhoto(slot: PhotoSlot, snapshot: DocumentSnapshot): StoredPhoto | null {
  return readSlot(slot, snapshot);
}

/** The stored photo as the API returns it, with download URLs. */
export function toPhoto(photo: StoredPhoto): Photo {
  return { ...toImage(photo), alt: photo.alt };
}

/** Puts the uploaded photo with its alt text in the slot, replacing the previous one. */
export async function savePhoto(
  slot: PhotoSlot,
  { alt, uploadId }: PhotoBody,
): Promise<SavedPhoto> {
  const { created, stored } = await fillSlot(slot, uploadId, (image) => ({ ...image, alt }));

  return { created, photo: toPhoto(stored) };
}

export function updatePhotoAlt(slot: PhotoSlot, alt: string): Promise<Photo> {
  return changeSlot(slot, (photo, transaction, document) => {
    if (!photo) {
      throw new NotFoundError("There is no photo");
    }

    transaction.update(document, { [`${slot.field}.alt`]: alt });
    return toPhoto({ ...photo, alt });
  });
}

export function deletePhoto(slot: PhotoSlot): Promise<void> {
  return clearSlot(slot);
}
