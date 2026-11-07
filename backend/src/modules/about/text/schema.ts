import { z } from "zod";

import { translationsBodySchema } from "#shared/i18n/translations";

/** The limit of each text. */
const aboutTextLimits = {
  about: 500,
  biography: 2_000,
  creation: 2_000,
};

/**
 * Plain text: no HTML or Markdown. Paragraphs are separated by a blank line. It cannot be empty:
 * the page looks unfinished without any of its sections.
 */
function aboutText(maxLength: number) {
  return z.string().trim().min(1).max(maxLength);
}

/** The texts of the About page; every text is sent. */
export const aboutTextBodySchema = z.strictObject({
  /** The short introduction next to «My photo». */
  about: aboutText(aboutTextLimits.about),
  /** The «Biography» section. */
  biography: aboutText(aboutTextLimits.biography),
  /** The «Artistic creation» section. */
  creation: aboutText(aboutTextLimits.creation),
  /** The texts above in the other languages; the server makes those not written by a person. */
  translations: translationsBodySchema(aboutTextLimits),
});

/**
 * The texts as stored in Firestore and as the API returns them. Only their shape is checked: the
 * limits above apply when the texts are saved, so tightening a limit later never makes saved texts
 * unreadable, and a text saved before is returned unchanged. Every text is empty until the texts
 * are first saved.
 */
export const aboutTextSchema = z.object({
  about: z.string(),
  biography: z.string(),
  creation: z.string(),
});

export type AboutText = z.infer<typeof aboutTextSchema>;
