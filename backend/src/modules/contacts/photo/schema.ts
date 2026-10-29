import { z } from "zod";

import { imageSchema, storedImageSchema } from "#shared/images/storage";

const altSchema = z
  .string()
  .trim()
  .min(1)
  .max(250)
  .meta({ description: "Text alternative for the photo." });

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

/** The photo as the API returns it, with download URLs in place of the stored paths. */
export const photoSchema = imageSchema.extend({ alt: altSchema }).meta({ id: "Photo" });

export const photoResponseSchema = z.object({ photo: photoSchema });

export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotoResponse = z.infer<typeof photoResponseSchema>;
