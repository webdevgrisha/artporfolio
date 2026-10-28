import { z } from "zod";

/** One encoded image, for a srcset. */
const imageSourceSchema = z.object({
  url: z.string(),
  width: z.number(),
});

/** The photo on the contacts page, resized to several widths. */
export const contactPhotoSchema = z.object({
  alt: z.string(),
  /** Name of the uploaded file. */
  fileName: z.string(),
  /** Size of the uploaded file, in bytes. */
  fileSize: z.number(),
  /** Size of the largest image. */
  height: z.number(),
  /** Ordered by width. */
  sources: z.object({
    avif: z.array(imageSourceSchema),
    webp: z.array(imageSourceSchema),
  }),
  version: z.string(),
  width: z.number(),
});

export type ContactPhoto = z.infer<typeof contactPhotoSchema>;

/** The shape of every API response that returns the photo. */
export const contactPhotoResponseSchema = z.object({
  photo: contactPhotoSchema,
});
