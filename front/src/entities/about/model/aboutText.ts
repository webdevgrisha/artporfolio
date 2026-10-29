import { z } from "zod";

/** The texts of the About page: plain text, paragraphs separated by a blank line. */
export const aboutTextSchema = z.object({
  /** The short introduction next to «Моё фото». */
  about: z.string(),
  biography: z.string(),
  creation: z.string(),
});

export type AboutText = z.infer<typeof aboutTextSchema>;

/** The shape of every API response that returns the texts. */
export const aboutTextResponseSchema = z.object({
  text: aboutTextSchema,
});
