import { z } from "zod";

import { contactLinksSchema } from "#modules/contacts/links/schema";
import { photoSchema } from "#shared/images/photo";

/** The whole contacts page in one read, for the site; each part is changed at its own resource. */
export const contactsResponseSchema = z.object({
  links: contactLinksSchema,
  /** null until a photo is uploaded. */
  photo: photoSchema.nullable(),
});

export type ContactsResponse = z.infer<typeof contactsResponseSchema>;
