import { z } from "zod";

/**
 * The text above the works in the gallery. Plain text: no HTML or Markdown; paragraphs are
 * separated by a blank line. An empty string means the site shows no text there.
 */
export const galleryIntroBodySchema = z.strictObject({
  text: z.string().trim().max(1_000),
});

/**
 * The text as stored in Firestore and as the API returns it. Only its shape is checked: the limit
 * above applies when the text is saved, so lowering it later never makes a saved text unreadable.
 * The text is empty until it is first saved.
 */
export const galleryIntroSchema = z.object({
  text: z.string(),
});

export const galleryIntroResponseSchema = z.object({ intro: galleryIntroSchema });

export type GalleryIntro = z.infer<typeof galleryIntroSchema>;
export type GalleryIntroResponse = z.infer<typeof galleryIntroResponseSchema>;
