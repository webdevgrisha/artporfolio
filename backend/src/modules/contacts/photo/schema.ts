import { z } from "zod";

import { type Image, storedImageSchema } from "#shared/images/storage";

const altSchema = z.string().trim().min(1).max(250);

/** Text fields sent with the photo file, and the body of an alt text update. */
export const photoAltBodySchema = z
  .object({
    alt: altSchema,
  })
  .strict();

/** The photo as stored in Firestore: the uploaded image and its alt text. */
export const storedPhotoSchema = storedImageSchema.extend({
  alt: altSchema,
});

export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;

/** The photo as the API returns it, with download URLs in place of the stored paths. */
export interface Photo extends Image {
  alt: string;
}
