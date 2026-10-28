import { z } from "zod";

// Mirror the server rules in backend/src/modules/contacts/schema.ts and photo/schema.ts.
const maxLinkLength = 2_048;
const maxAltLength = 250;

/** An empty string hides the contact on the site. */
function optionalContact(format: z.ZodType<string, string>) {
  return z
    .string()
    .trim()
    .max(maxLinkLength, `Не длиннее ${String(maxLinkLength)} символов`)
    .pipe(z.union([z.literal(""), format]));
}

const webLink = optionalContact(z.httpUrl("Введите ссылку вида https://…"));

export const contactLinksSchema = z.object({
  email: optionalContact(z.email("Введите корректный email")),
  instagram: webLink,
  linkedin: webLink,
  youtube: webLink,
});

export const photoAltSchema = z
  .string()
  .trim()
  .min(1, "Опишите, что на фото")
  .max(maxAltLength, `Не длиннее ${String(maxAltLength)} символов`);

/** The photo field value that keeps the photo already on the server. */
export const savedPhoto = "saved";

export const contactsFormSchema = contactLinksSchema
  .extend({
    /** The saved photo, a newly picked file, or `null` for no photo. */
    photo: z.union([z.literal(savedPhoto), z.instanceof(File), z.null()]),
    photoAlt: z.string().trim(),
  })
  .superRefine(({ photo, photoAlt }, context) => {
    // Without a photo the alt text is hidden and not saved.
    if (photo === null) return;

    const alt = photoAltSchema.safeParse(photoAlt);

    for (const issue of alt.error?.issues ?? []) {
      context.addIssue({ code: "custom", message: issue.message, path: ["photoAlt"] });
    }
  });

export type ContactsFormValues = z.infer<typeof contactsFormSchema>;
