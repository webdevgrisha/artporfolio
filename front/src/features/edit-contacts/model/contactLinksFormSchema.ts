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

const webLink = optionalContact(z.httpUrl("Введите ссылку вида https://…"));

export const contactLinksFormSchema = z.object({
  /** Required, so the Contacts page always has a way to write to the artist. */
  email: z
    .string()
    .trim()
    .min(1, "Введите email")
    .max(maxLinkLength, `Не длиннее ${String(maxLinkLength)} символов`)
    .pipe(z.email("Введите корректный email")),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

export type ContactLinksFormValues = z.infer<typeof contactLinksFormSchema>;
