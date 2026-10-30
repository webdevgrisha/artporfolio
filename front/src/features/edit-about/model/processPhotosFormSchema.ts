import { z } from "zod";

import { maxProcessPhotos, type ProcessPhoto } from "@/entities/about";
import { photoAltSchema } from "@/shared/lib/photoForm";

const processPhotoRowSchema = z.discriminatedUnion("status", [
  z.object({
    alt: photoAltSchema,
    /** A picked file that replaces the saved one; `null` keeps the saved file. */
    file: z.instanceof(File).nullable(),
    /** The photo on the server the row was made from, as the user saw it. */
    photo: z.custom<ProcessPhoto>(),
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

export const processPhotosFormSchema = z.object({
  /** In the order the site shows them. */
  processPhotos: z
    .array(processPhotoRowSchema)
    .max(maxProcessPhotos, `Не больше ${String(maxProcessPhotos)} фото`),
});

export type ProcessPhotosFormValues = z.infer<typeof processPhotosFormSchema>;
