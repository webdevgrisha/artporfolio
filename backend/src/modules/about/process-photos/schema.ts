import { z } from "zod";

import { photoSchema, storedPhotoSchema } from "#shared/images/photo";

/** The most process photos the page may have; raise it when the artist needs more. */
export const maxProcessPhotos = 30;

/** Stays the same when the file is replaced. */
const processPhotoIdSchema = z.uuid();

/** The path parameters of a request about one process photo. */
export const processPhotoParamsSchema = z.object({
  id: processPhotoIdSchema,
});

/** A process photo as stored in Firestore, in the array that keeps their order. */
export const storedProcessPhotoSchema = storedPhotoSchema.extend({
  id: processPhotoIdSchema,
});

/** A photo of the work in progress, as the API returns it. */
export const processPhotoSchema = photoSchema.extend({ id: processPhotoIdSchema });

const processPhotoOrderFields = {
  /** Every process photo id, once, in the order the site shows them. */
  ids: z
    .array(processPhotoIdSchema)
    .max(maxProcessPhotos)
    .refine((ids) => new Set(ids).size === ids.length, "Each id must appear once"),
};

/** The order of the process photos. */
export const processPhotoOrderSchema = z.object(processPhotoOrderFields);

export const processPhotoOrderBodySchema = z.strictObject(processPhotoOrderFields);

export const processPhotosResponseSchema = z.object({
  /** In the order the site shows them. */
  processPhotos: z.array(processPhotoSchema),
});

export const processPhotoResponseSchema = z.object({ processPhoto: processPhotoSchema });

export type ProcessPhotoParams = z.infer<typeof processPhotoParamsSchema>;
export type StoredProcessPhoto = z.infer<typeof storedProcessPhotoSchema>;
export type ProcessPhoto = z.infer<typeof processPhotoSchema>;
export type ProcessPhotoOrder = z.infer<typeof processPhotoOrderSchema>;
export type ProcessPhotosResponse = z.infer<typeof processPhotosResponseSchema>;
export type ProcessPhotoResponse = z.infer<typeof processPhotoResponseSchema>;
