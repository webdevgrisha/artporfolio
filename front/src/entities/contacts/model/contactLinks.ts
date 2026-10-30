import { z } from "zod";

/** Links shown on the public site. An empty string means the contact is hidden. */
export const contactLinksSchema = z.object({
  email: z.string(),
  instagram: z.string(),
  linkedin: z.string(),
  youtube: z.string(),
});

export type ContactLinks = z.infer<typeof contactLinksSchema>;

/** The shape of every API response that returns the links. */
export const contactLinksResponseSchema = z.object({
  links: contactLinksSchema,
});
