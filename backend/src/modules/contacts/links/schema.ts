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

/** Whether the link goes to one of `domains` or to a subdomain of one, such as www. or m. */
function isLinkTo(link: string, domains: readonly string[]): boolean {
  const { hostname } = new URL(link);

  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

/** A link to the profile on a network at `domains`, so a link cannot land in the wrong field. */
function networkLink(domains: readonly string[]) {
  // Unlike z.url(), rejects "javascript:" links, which would run code when a visitor clicks them.
  // The pipe checks the domain only of a valid link; an empty one hides the contact.
  return optionalContact(z.httpUrl()).pipe(
    z
      .string()
      .refine(
        (link) => link === "" || isLinkTo(link, domains),
        `Must be a link to ${domains.join(" or ")}`,
      ),
  );
}

/**
 * All contact links. Every link is sent, empty when the site does not show it; the email is
 * required, so the Contacts page always has a way to write to the artist.
 */
export const contactLinksBodySchema = z.strictObject({
  email: z.string().trim().max(maxLength).pipe(z.email()),
  instagram: networkLink(["instagram.com"]),
  linkedin: networkLink(["linkedin.com"]),
  youtube: networkLink(["youtube.com", "youtu.be"]),
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
