import { z } from "zod";

/** Links shown on the public site. An empty string means the contact is hidden. */
export const contactsSchema = z.object({
  email: z.string(),
  instagram: z.string(),
  linkedin: z.string(),
  youtube: z.string(),
});

export type Contacts = z.infer<typeof contactsSchema>;

/** The shape of every API response that returns the contacts. */
export const contactsResponseSchema = z.object({
  contacts: contactsSchema,
});
