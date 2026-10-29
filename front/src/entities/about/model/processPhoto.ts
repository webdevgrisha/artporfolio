import { z } from "zod";

import { imageSchema } from "@/shared/api/image";

/** The most process photos the page may have (backend/src/modules/about/process-photos/schema.ts). */
export const maxProcessPhotos = 30;

/** A photo of the work in progress. The id stays the same when the file is replaced. */
export const processPhotoSchema = imageSchema.extend({
  alt: z.string(),
  id: z.string(),
});

export type ProcessPhoto = z.infer<typeof processPhotoSchema>;

/** The shape of every API response that returns one process photo. */
export const processPhotoResponseSchema = z.object({
  processPhoto: processPhotoSchema,
});
