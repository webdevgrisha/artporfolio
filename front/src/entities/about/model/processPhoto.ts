import { z } from "zod";

import { photoSchema } from "@/shared/api/photo";

/** The most process photos the page may have (backend/src/modules/about/process-photos/schema.ts). */
export const maxProcessPhotos = 30;

/** A photo of the work in progress. The id stays the same when the file is replaced. */
export const processPhotoSchema = photoSchema.extend({
  id: z.string(),
});

export type ProcessPhoto = z.infer<typeof processPhotoSchema>;

/** The shape of every API response that returns the process photos. */
export const processPhotosResponseSchema = z.object({
  /** In the order the site shows them. */
  processPhotos: z.array(processPhotoSchema),
});
