import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { UnprocessableContentError } from "#shared/http/errors";
import type { Tagged } from "#shared/http/etag";
import { requestTranslations, saveSources } from "#shared/i18n/translation-store";
import { changeSlot, fillSlot, getSlot, type ImageSlot, readSlot } from "#shared/images/slot";
import { type Image, storedImageSchema, toImage } from "#shared/images/stored-image";
import { uploadIdSchema } from "#shared/images/uploads";

/** The text alternative of a photo. */
export const altSchema = z.string().trim().min(1).max(250);

/**
 * A photo as a change sends it: a new file by its upload (see uploads.ts), or the saved file when
 * `uploadId` is left out, so the alt text can change alone.
 */
export const photoBodySchema = z.strictObject({
  alt: altSchema,
  uploadId: uploadIdSchema.optional(),
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
export interface Photo extends Image {
  alt: string;
}

export type PhotoBody = z.infer<typeof photoBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;

/** A single photo with its alt text, such as «My photo» or the contact photo. */
export interface PhotoSlot extends ImageSlot<StoredPhoto> {
  /** Where the translations of the alt text go. */
  resource: string;
}

/** The saved photo with its tag, and whether it is the first one rather than a replacement. */
export interface SavedPhoto extends Tagged<Photo> {
  created: boolean;
}

/** A photo slot in a field of `document`, with its versions in the Storage folder `folder`. */
export function photoSlot(place: {
  document: () => DocumentReference;
  field: string;
  folder: string;
  resource: string;
}): PhotoSlot {
  return {
    ...place,
    saveAlong: (transaction, { alt }) => saveSources(transaction, place.resource, { alt }),
    schema: storedPhotoSchema,
  };
}

export function readPhoto(slot: PhotoSlot, snapshot: DocumentSnapshot): StoredPhoto | null {
  return readSlot(slot, snapshot);
}

/** The stored photo as the API returns it, with download URLs. */
export function toPhoto(photo: StoredPhoto): Photo {
  return { ...toImage(photo), alt: photo.alt };
}

/** The photo of the slot, `null` while it is empty, with the entity tag for If-Match. */
export async function getPhoto(slot: PhotoSlot): Promise<Tagged<Photo | null>> {
  const { data, etag } = await getSlot(slot);

  return { data: data && toPhoto(data), etag };
}

/**
 * Puts the uploaded photo with its alt text in the slot, replacing the previous one. Without an
 * upload the slot keeps its file and takes the alt text alone, so an empty slot refuses it.
 */
export async function savePhoto(
  slot: PhotoSlot,
  { alt, uploadId }: PhotoBody,
  ifMatch: string,
): Promise<SavedPhoto> {
  if (uploadId === undefined) {
    const { data, etag } = await changeSlot(slot, ifMatch, (photo) => {
      if (!photo) {
        throw new UnprocessableContentError("There is no photo to keep: send an upload");
      }

      return { ...photo, alt };
    });

    await requestTranslations(slot.resource);

    return { created: false, data: toPhoto(data), etag };
  }

  const { created, data, etag } = await fillSlot(slot, uploadId, ifMatch, (image) => ({
    ...image,
    alt,
  }));

  await requestTranslations(slot.resource);

  return { created, data: toPhoto(data), etag };
}
