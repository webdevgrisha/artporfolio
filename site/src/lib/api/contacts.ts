import { z } from "zod";

import { photoSchema } from "@/lib/api/image";

/** A link of the Contacts page; an empty one is not shown. */
const contactLinkSchema = z.string();

/** The links of the artist, as `GET /api/contacts/links` returns them. */
export const contactLinksSchema = z.object({
  email: contactLinkSchema,
  instagram: contactLinkSchema,
  linkedin: contactLinkSchema,
  youtube: contactLinkSchema,
});

/** The Contacts page as `GET /api/contacts` returns it. */
export const contactsSchema = z.object({
  links: contactLinksSchema,
  /** What the slideshow shows, in order; empty when there is nothing to show. */
  photos: z.array(photoSchema),
});

export type ContactLinks = z.infer<typeof contactLinksSchema>;
