import { z } from "zod";

import { listPhotoSchema } from "@/shared/api/photo";

/** The most process photos the page may have (backend/src/modules/about/process-photos/schema.ts). */
export const maxProcessPhotos = 30;

/** The shape of every API response that returns the process photos. */
export const processPhotosResponseSchema = z.object({
  /** In the order the site shows them. */
  processPhotos: z.array(listPhotoSchema),
});
