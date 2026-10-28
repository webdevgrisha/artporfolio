import { z } from "zod";

// Mirrors the server rules in backend/src/modules/contacts/schema.ts.
const maxLength = 2_048;

/** An empty string hides the contact on the site. */
function optionalContact(format: z.ZodType<string, string>) {
  return z
    .string()
    .trim()
    .max(maxLength, `Не длиннее ${String(maxLength)} символов`)
    .pipe(z.union([z.literal(""), format]));
}

const webLink = optionalContact(z.httpUrl("Введите ссылку вида https://…"));

export const contactsFormSchema = z.object({
  email: optionalContact(z.email("Введите корректный email")),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

export type ContactsFormValues = z.infer<typeof contactsFormSchema>;
