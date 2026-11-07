import { z } from "zod";

import { translationsBodySchema } from "#shared/i18n/translations";

/** The longest text. */
const maxIntroLength = 1_000;

/**
 * The text above the works in the gallery. Plain text: no HTML or Markdown; paragraphs are
 * separated by a blank line. An empty string means the site shows no text there.
 */
export const galleryIntroBodySchema = z.strictObject({
  text: z.string().trim().max(maxIntroLength),
  /** The text in the other languages; the server makes those not written by a person. */
  translations: translationsBodySchema({ text: maxIntroLength }),
});

/**
 * The text as stored in Firestore and as the API returns it. Only its shape is checked: the limit
 * above applies when the text is saved, so lowering it later never makes a saved text unreadable.
 * The text is empty until it is first saved.
 */
export const galleryIntroSchema = z.object({
  text: z.string(),
});

export type GalleryIntro = z.infer<typeof galleryIntroSchema>;
