import { z } from "zod";

/**
 * Plain text: no HTML or Markdown. Paragraphs are separated by a blank line. An empty string
 * means the site does not show the section.
 */
function aboutText(maxLength: number) {
  return z.string().trim().max(maxLength);
}

/** The texts of the About page. Every text is sent, empty when its section is hidden. */
export const aboutTextBodySchema = z.strictObject({
  /** The short introduction next to «My photo». */
  about: aboutText(500),
  /** The «Biography» section. */
  biography: aboutText(2_000),
  /** The «Artistic creation» section. */
  creation: aboutText(2_000),
});

/**
 * The texts as stored in Firestore. Only their shape is checked: the limits above apply when the
 * texts are saved, so tightening a limit later never makes saved texts unreadable.
 */
export const storedAboutTextSchema = z.object({
  about: z.string(),
  biography: z.string(),
  creation: z.string(),
});

/**
 * The texts as the API returns them: as they were saved, so only their shape is described. A text
 * saved before a limit was lowered is returned unchanged. Every text is empty until the texts are
 * first saved.
 */
export const aboutTextSchema = z.object({
  about: z.string(),
  biography: z.string(),
  creation: z.string(),
});

export const aboutTextResponseSchema = z.object({ text: aboutTextSchema });

export type AboutText = z.infer<typeof aboutTextSchema>;
export type AboutTextResponse = z.infer<typeof aboutTextResponseSchema>;
