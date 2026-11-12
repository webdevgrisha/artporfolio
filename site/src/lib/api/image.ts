import { z } from "zod";

/** One file of an image: its download URL never changes, so it is cached for a year. */
const imageFileSchema = z.object({
  url: z.url(),
  width: z.number().int().positive(),
});

/**
 * An image as the API returns it: files of several widths in AVIF and WebP, each list ordered by
 * width, the size of the largest one, which gives the shape of the image, and its preview.
 */
export const imageSchema = z.object({
  height: z.number().int().positive(),
  /** The image 16px wide as a `data:` URL, which a page shows stretched and blurred while it loads. */
  placeholder: z.string().startsWith("data:image/"),
  sources: z.object({
    avif: z.array(imageFileSchema).nonempty(),
    webp: z.array(imageFileSchema).nonempty(),
  }),
  width: z.number().int().positive(),
});

/** An image with its text alternative, in the language of the page. */
export const photoSchema = imageSchema.extend({
  alt: z.string(),
});

export type ImageFile = z.infer<typeof imageFileSchema>;
export type Image = z.infer<typeof imageSchema>;
export type Photo = z.infer<typeof photoSchema>;
