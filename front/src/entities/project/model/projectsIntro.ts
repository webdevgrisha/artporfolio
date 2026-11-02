import { z } from "zod";

/**
 * The text above the list of projects: plain text, paragraphs separated by a blank line. An empty
 * text is not shown; it is empty until it is first saved.
 */
export const projectsIntroSchema = z.object({
  text: z.string(),
});

export type ProjectsIntro = z.infer<typeof projectsIntroSchema>;

/** The shape of every API response that returns the text. */
export const projectsIntroResponseSchema = z.object({
  intro: projectsIntroSchema,
});
