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
  email: optionalContact(z.email()).meta({ description: "Empty, or an email address." }),
  instagram: webLink.meta({ description: "Empty, or an `http(s)` URL with a domain." }),
  linkedin: webLink.meta({ description: "Empty, or an `http(s)` URL with a domain." }),
  youtube: webLink.meta({ description: "Empty, or an `http(s)` URL with a domain." }),
};

export const contactsSchema = z.object(contactFields).meta({
  id: "Contacts",
  description: "Contact links. An empty string means the contact is not shown on the site.",
});

export const contactsBodySchema = z.strictObject(contactFields);

export const contactsResponseSchema = z.object({
  contacts: contactsSchema,
  photo: photoSchema.nullable().meta({ description: "`null` until a photo is uploaded." }),
});

export const savedContactsResponseSchema = z.object({ contacts: contactsSchema });

export type Contacts = z.infer<typeof contactsSchema>;
export type ContactsResponse = z.infer<typeof contactsResponseSchema>;
export type SavedContactsResponse = z.infer<typeof savedContactsResponseSchema>;
