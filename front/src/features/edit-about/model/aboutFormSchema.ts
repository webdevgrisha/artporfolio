import { z } from "zod";

import { type AboutText, maxProcessPhotos } from "@/entities/about";

// Mirror the server rules in backend/src/modules/about/schema.ts and shared/images/photo.ts.
export const aboutTextMaxLengths: Readonly<Record<keyof AboutText, number>> = {
  about: 500,
  biography: 2_000,
  creation: 2_000,
};
const maxAltLength = 250;

function aboutText(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, "Заполните поле")
    .max(maxLength, `Не длиннее ${String(maxLength)} символов`);
}

const photoAltSchema = z
  .string()
  .trim()
  .min(1, "Опишите, что на фото")
  .max(maxAltLength, `Не длиннее ${String(maxAltLength)} символов`);

/** The photo field value that keeps the photo already on the server. */
export const savedPhoto = "saved";

const processPhotoRowSchema = z.discriminatedUnion("status", [
  z.object({
    alt: photoAltSchema,
    /** A picked file that replaces the saved one; `null` keeps the saved file. */
    file: z.instanceof(File).nullable(),
    photoId: z.string(),
    status: z.literal("saved"),
  }),
  z.object({
    alt: photoAltSchema,
    file: z.instanceof(File),
    status: z.literal("new"),
  }),
]);

/** A row of the process photos: a photo on the server, or a new one to upload. */
export type ProcessPhotoRow = z.infer<typeof processPhotoRowSchema>;

export const aboutFormSchema = z
  .object({
    about: aboutText(aboutTextMaxLengths.about),
    biography: aboutText(aboutTextMaxLengths.biography),
    creation: aboutText(aboutTextMaxLengths.creation),
    /** The saved photo, a newly picked file, or `null` for no photo. */
    photo: z.union([z.literal(savedPhoto), z.instanceof(File), z.null()]),
    photoAlt: z.string().trim(),
    /** In the order the site shows them. */
    processPhotos: z
      .array(processPhotoRowSchema)
      .max(maxProcessPhotos, `Не больше ${String(maxProcessPhotos)} фото`),
  })
  .superRefine(({ photo, photoAlt }, context) => {
    // Without a photo the alt text is hidden and not saved.
    if (photo === null) return;

    const alt = photoAltSchema.safeParse(photoAlt);

    for (const issue of alt.error?.issues ?? []) {
      context.addIssue({ code: "custom", message: issue.message, path: ["photoAlt"] });
    }
  });

export type AboutFormValues = z.infer<typeof aboutFormSchema>;
