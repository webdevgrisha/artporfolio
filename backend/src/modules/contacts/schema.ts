import { z } from "zod";

import { photoSchema } from "#shared/images/photo";

const maxLength = 2_048;

/** An empty string means the contact is not shown on the site. */
function optionalContact(format: z.ZodType<string, string>) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .pipe(z.union([z.literal(""), format]));
}

// Unlike z.url(), rejects "javascript:" links, which would run code when a visitor clicks them.
const webLink = optionalContact(z.httpUrl());

const contactFields = {
  email: optionalContact(z.email()),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
};

export const contactsSchema = z.object(contactFields);

export const contactsBodySchema = z.strictObject(contactFields);

/**
 * The links as stored in Firestore. Only their shape is checked: the rules above apply when the
 * links are saved, so tightening a rule later never makes saved links unreadable.
 */
export const storedContactsSchema = z.object({
  email: z.string(),
  instagram: z.string(),
  linkedin: z.string(),
  youtube: z.string(),
});

export const contactsResponseSchema = z.object({
  contacts: contactsSchema,
  /** null until a photo is uploaded. */
  photo: photoSchema.nullable(),
});

export const savedContactsResponseSchema = z.object({ contacts: contactsSchema });

export type Contacts = z.infer<typeof contactsSchema>;
export type ContactsResponse = z.infer<typeof contactsResponseSchema>;
export type SavedContactsResponse = z.infer<typeof savedContactsResponseSchema>;
