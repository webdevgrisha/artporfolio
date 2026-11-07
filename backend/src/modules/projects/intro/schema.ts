import { z } from "zod";

import { translationsBodySchema } from "#shared/i18n/translations";

/** The longest text. */
const maxIntroLength = 1_000;

/**
 * The text above the list of projects, which cannot be empty: the page looks unfinished without
 * it. Plain text: no HTML or Markdown; paragraphs are separated by a blank line.
 */
export const projectsIntroBodySchema = z.strictObject({
  text: z.string().trim().min(1).max(maxIntroLength),
  /** The text in the other languages; the server makes those not written by a person. */
  translations: translationsBodySchema({ text: maxIntroLength }),
});

/**
 * The text as stored in Firestore and as the API returns it. Only its shape is checked: the limit
 * above applies when the text is saved, so lowering it later never makes a saved text unreadable.
 * The text is empty until it is first saved.
 */
export const projectsIntroSchema = z.object({
  text: z.string(),
});

export type ProjectsIntro = z.infer<typeof projectsIntroSchema>;
