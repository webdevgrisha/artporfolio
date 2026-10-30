import { z } from "zod";

import { processPhotoSchema } from "#modules/about/process-photos/schema";
import { aboutTextSchema } from "#modules/about/text/schema";
import { photoSchema } from "#shared/images/photo";

/** The whole About page in one read, for the site; each part is changed at its own resource. */
export const aboutResponseSchema = z.object({
  text: aboutTextSchema,
  /** «My photo»; null until one is uploaded. */
  photo: photoSchema.nullable(),
  /** In the order the site shows them. */
  processPhotos: z.array(processPhotoSchema),
});

export type AboutResponse = z.infer<typeof aboutResponseSchema>;
