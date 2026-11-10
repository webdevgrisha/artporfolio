import { z } from "zod";

import { photoSchema } from "@/lib/api/image";

/** A link of the Contacts page; an empty one is not shown. */
const contactLinkSchema = z.string();

/** The Contacts page as `GET /api/contacts` returns it. */
export const contactsSchema = z.object({
  links: z.object({
    email: contactLinkSchema,
    instagram: contactLinkSchema,
    linkedin: contactLinkSchema,
    youtube: contactLinkSchema,
  }),
  /** null until the artist uploads one. */
  photo: photoSchema.nullable(),
});

export type ContactLinks = z.infer<typeof contactsSchema>["links"];
