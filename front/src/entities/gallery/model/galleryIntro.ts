import { z } from "zod";

import { translationsSchema } from "@/shared/api/translations";

/**
 * The text above the works in the gallery: plain text, paragraphs separated by a blank line. An
 * empty text is not shown; it is empty until it is first saved.
 */
export const galleryIntroSchema = z.object({
  text: z.string(),
  /** The text in the other languages. */
  translations: translationsSchema,
});

export type GalleryIntro = z.infer<typeof galleryIntroSchema>;
