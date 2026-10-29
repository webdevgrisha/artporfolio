import { z } from "zod";

import { photoFieldsShape, refinePhotoAlt } from "@/shared/lib/photoForm";

// Mirrors the server rule in backend/src/modules/contacts/schema.ts.
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

const contactLinksSchema = z.object({
  email: optionalContact(z.email("Введите корректный email")),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

export const contactsFormSchema = contactLinksSchema
  .extend(photoFieldsShape)
  .superRefine(refinePhotoAlt);

export type ContactsFormValues = z.infer<typeof contactsFormSchema>;
