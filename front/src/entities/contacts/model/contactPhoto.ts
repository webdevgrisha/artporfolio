import { z } from "zod";

import { imageSchema } from "@/shared/api/image";

/** The photo on the contacts page: an uploaded image with its description. */
export const contactPhotoSchema = imageSchema.extend({
  alt: z.string(),
});

export type ContactPhoto = z.infer<typeof contactPhotoSchema>;

/** The shape of every API response that returns the photo. */
export const contactPhotoResponseSchema = z.object({
  photo: contactPhotoSchema,
});
