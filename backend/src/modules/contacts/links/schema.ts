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

/** All contact links. Every link is sent, empty when the site does not show it. */
export const contactLinksBodySchema = z.strictObject({
  email: optionalContact(z.email()),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

/**
 * The links as stored in Firestore and as the API returns them. Only their shape is checked: the
 * rules above apply when the links are saved, so tightening a rule later never makes saved links
 * unreadable, and a link saved before is returned unchanged. Every link is empty until the links
 * are first saved.
 */
export const contactLinksSchema = z.object({
  email: z.string(),
  instagram: z.string(),
  linkedin: z.string(),
  youtube: z.string(),
});

export const contactLinksResponseSchema = z.object({ links: contactLinksSchema });

export type ContactLinks = z.infer<typeof contactLinksSchema>;
export type ContactLinksResponse = z.infer<typeof contactLinksResponseSchema>;
