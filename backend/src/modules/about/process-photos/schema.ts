import { z } from "zod";

import { altSchema, photoSchema, storedPhotoSchema } from "#shared/images/photo";
import { uploadIdSchema } from "#shared/images/uploads";

/** The most process photos the page may have; raise it when the artist needs more. */
export const maxProcessPhotos = 30;

/** Stays the same when the file is replaced. */
const processPhotoIdSchema = z.uuid();

/** A process photo as stored in Firestore, in the array that keeps their order. */
export const storedProcessPhotoSchema = storedPhotoSchema.extend({
  id: processPhotoIdSchema,
});

/** A photo of the work in progress, as the API returns it. */
export const processPhotoSchema = photoSchema.extend({ id: processPhotoIdSchema });

/** One photo of the new list: a saved one by its id, a new file by its upload, or both to replace the file. */
const processPhotoItemSchema = z
  .strictObject({
    alt: altSchema,
    /** A saved photo; it keeps its id and its file unless `uploadId` replaces the file. */
    id: processPhotoIdSchema.optional(),
    /** The file of a new photo, or the new file of a saved one. */
    uploadId: uploadIdSchema.optional(),
  })
  .refine((item) => item.id !== undefined || item.uploadId !== undefined, {
    message: "A photo needs an id, an uploadId or both",
  });

function isDistinct(values: (string | undefined)[]): boolean {
  const defined = values.filter((value) => value !== undefined);

  return new Set(defined).size === defined.length;
}

/** The whole list of process photos, which replaces the saved one. */
export const processPhotosBodySchema = z.strictObject({
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: z
    .array(processPhotoItemSchema)
    .max(maxProcessPhotos)
    .refine((items) => isDistinct(items.map((item) => item.id)), "Each id must appear once")
    .refine(
      (items) => isDistinct(items.map((item) => item.uploadId)),
      "Each uploadId must appear once",
    ),
});

export const processPhotosResponseSchema = z.object({
  /** In the order the site shows them. */
  processPhotos: z.array(processPhotoSchema),
});

export type StoredProcessPhoto = z.infer<typeof storedProcessPhotoSchema>;
export type ProcessPhoto = z.infer<typeof processPhotoSchema>;
export type ProcessPhotoItem = z.infer<typeof processPhotoItemSchema>;
export type ProcessPhotosBody = z.infer<typeof processPhotosBodySchema>;
export type ProcessPhotosResponse = z.infer<typeof processPhotosResponseSchema>;
