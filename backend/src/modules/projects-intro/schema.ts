import { z } from "zod";

/**
 * The text above the list of projects, which cannot be empty: the page looks unfinished without
 * it. Plain text: no HTML or Markdown; paragraphs are separated by a blank line.
 */
export const projectsIntroBodySchema = z.strictObject({
  text: z.string().trim().min(1).max(1_000),
});

/**
 * The text as stored in Firestore and as the API returns it. Only its shape is checked: the limit
 * above applies when the text is saved, so lowering it later never makes a saved text unreadable.
 * The text is empty until it is first saved.
 */
export const projectsIntroSchema = z.object({
  text: z.string(),
});

export const projectsIntroResponseSchema = z.object({ intro: projectsIntroSchema });

export type ProjectsIntro = z.infer<typeof projectsIntroSchema>;
export type ProjectsIntroResponse = z.infer<typeof projectsIntroResponseSchema>;
