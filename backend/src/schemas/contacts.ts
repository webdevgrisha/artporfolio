import { z } from "zod";

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

export const contactsSchema = z.object({
  email: optionalContact(z.email()),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

export const contactsBodySchema = contactsSchema.strict();

export type Contacts = z.infer<typeof contactsSchema>;
