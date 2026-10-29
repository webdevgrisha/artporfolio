import { z } from "zod";

import { imageSchema } from "@/shared/api/image";

/** «Моё фото» on the About page: an uploaded image with its description. */
export const aboutPhotoSchema = imageSchema.extend({
  alt: z.string(),
});

export type AboutPhoto = z.infer<typeof aboutPhotoSchema>;

/** The shape of every API response that returns the photo. */
export const aboutPhotoResponseSchema = z.object({
  photo: aboutPhotoSchema,
});
