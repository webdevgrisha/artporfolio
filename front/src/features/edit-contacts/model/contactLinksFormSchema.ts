import { z } from "zod";

// Mirrors the server rules in backend/src/modules/contacts/links/schema.ts.
const maxLinkLength = 2_048;

/** An empty string hides the contact on the site. */
function optionalContact(format: z.ZodType<string, string>) {
  return z
    .string()
    .trim()
    .max(maxLinkLength, `Не длиннее ${String(maxLinkLength)} символов`)
    .pipe(z.union([z.literal(""), format]));
}

/** Whether the link goes to one of `domains` or to a subdomain of one, such as www. or m. */
function isLinkTo(link: string, domains: readonly string[]): boolean {
  const { hostname } = new URL(link);

  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

/** A link to the profile on the network `name` at `domains`. */
function networkLink(name: string, domains: readonly string[]) {
  // The pipe checks the domain only of a valid link; an empty one hides the contact.
  return optionalContact(z.httpUrl("Введите ссылку вида https://…")).pipe(
    z
      .string()
      .refine((link) => link === "" || isLinkTo(link, domains), `Введите ссылку на ${name}`),
  );
}

export const contactLinksFormSchema = z.object({
  /** Required, so the Contacts page always has a way to write to the artist. */
  email: z
    .string()
    .trim()
    .min(1, "Введите email")
    .max(maxLinkLength, `Не длиннее ${String(maxLinkLength)} символов`)
    .pipe(z.email("Введите корректный email")),
  instagram: networkLink("Instagram", ["instagram.com"]),
  linkedin: networkLink("LinkedIn", ["linkedin.com"]),
  youtube: networkLink("YouTube", ["youtube.com", "youtu.be"]),
});

export type ContactLinksFormValues = z.infer<typeof contactLinksFormSchema>;
