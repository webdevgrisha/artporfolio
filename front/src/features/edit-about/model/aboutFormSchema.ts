import { z } from "zod";

import { type AboutText, maxProcessPhotos } from "@/entities/about";
import { photoAltSchema, photoFieldsShape, refinePhotoAlt } from "@/shared/lib/photoForm";

// Mirror the server rules in backend/src/modules/about/schema.ts.
export const aboutTextMaxLengths: Readonly<Record<keyof AboutText, number>> = {
  about: 500,
  biography: 2_000,
  creation: 2_000,
};

/** An empty text hides its section on the site. */
function aboutText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Не длиннее ${String(maxLength)} символов`);
}

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
    ...photoFieldsShape,
    /** In the order the site shows them. */
    processPhotos: z
      .array(processPhotoRowSchema)
      .max(maxProcessPhotos, `Не больше ${String(maxProcessPhotos)} фото`),
  })
  .superRefine(refinePhotoAlt);

export type AboutFormValues = z.infer<typeof aboutFormSchema>;
