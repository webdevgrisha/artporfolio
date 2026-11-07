import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";

import { UnprocessableContentError } from "#shared/http/errors";
import { assertIfMatch, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import {
  storedTranslationsSchema,
  type Translations,
  toTranslations,
} from "#shared/i18n/translations";
import { changeSlot, fillSlot, getSlot, type ImageSlot, readSlot } from "#shared/images/slot";
import { type Image, storedImageSchema, toImage } from "#shared/images/stored-image";
import { uploadIdSchema } from "#shared/images/uploads";

/** The longest text alternative of a photo. */
export const maxAltLength = 250;

/** The text alternative of a photo. */
export const altSchema = z.string().trim().min(1).max(maxAltLength);

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

/** A photo of a slot as stored: its alt text is translated when it is saved. */
const storedSlotPhotoSchema = storedPhotoSchema.extend({
  translations: storedTranslationsSchema,
});

/** A photo of a slot as the API returns it, with its alt text in the other languages. */
export interface SlotPhoto extends Photo {
  translations: Translations;
}

export type PhotoBody = z.infer<typeof photoBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;
export type StoredSlotPhoto = z.infer<typeof storedSlotPhotoSchema>;

/** A single photo with its alt text, such as «My photo» or the contact photo. */
export type PhotoSlot = ImageSlot<StoredSlotPhoto>;

/** The saved photo with its tag, and whether it is the first one rather than a replacement. */
export interface SavedPhoto extends Tagged<SlotPhoto> {
  created: boolean;
}

/** A photo slot in a field of `document`, with its versions in the Storage folder `folder`. */
export function photoSlot(place: {
  document: () => DocumentReference;
  field: string;
  folder: string;
}): PhotoSlot {
  return { ...place, schema: storedSlotPhotoSchema };
}

export function readPhoto(slot: PhotoSlot, snapshot: DocumentSnapshot): StoredSlotPhoto | null {
  return readSlot(slot, snapshot);
}

/** The stored photo as the API returns it, with download URLs. */
export function toPhoto(photo: StoredPhoto): Photo {
  return { ...toImage(photo), alt: photo.alt };
}

/** The stored photo of a slot as the API returns it. */
export function toSlotPhoto(photo: StoredSlotPhoto): SlotPhoto {
  return {
    ...toPhoto(photo),
    translations: toTranslations(photo.translations, { alt: photo.alt }),
  };
}

/** The photo of the slot, `null` while it is empty, with the entity tag for If-Match. */
export async function getPhoto(slot: PhotoSlot): Promise<Tagged<SlotPhoto | null>> {
  const { data, etag } = await getSlot(slot);

  return { data: data && toSlotPhoto(data), etag };
}

/**
 * Puts the uploaded photo with its alt text in the slot, replacing the previous one. Without an
 * upload the slot keeps its file and takes the alt text alone, so an empty slot refuses it. The
 * translator runs first, outside the transaction, which may run several times: the tag checked
 * there covers the translations, so the ones it started from are still the saved ones.
 */
export async function savePhoto(
  slot: PhotoSlot,
  { alt, uploadId }: PhotoBody,
  ifMatch: string,
): Promise<SavedPhoto> {
  const { data: saved } = await getSlot(slot);

  // Nothing is paid for a change that the check in the transaction would reject anyway.
  assertIfMatch(ifMatch, saved);

  const translations = await saveTranslations({ alt }, saved?.translations ?? {}, {});

  if (uploadId === undefined) {
    const { data, etag } = await changeSlot(slot, ifMatch, (photo) => {
      if (!photo) {
        throw new UnprocessableContentError("There is no photo to keep: send an upload");
      }

      return { ...photo, alt, translations };
    });

    return { created: false, data: toSlotPhoto(data), etag };
  }

  const { created, data, etag } = await fillSlot(slot, uploadId, ifMatch, (image) => ({
    ...image,
    alt,
    translations,
  }));

  return { created, data: toSlotPhoto(data), etag };
}
