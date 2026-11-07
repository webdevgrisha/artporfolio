import { z } from "zod";

import { type ListPhoto, photoListBodySchema } from "#shared/images/photo-list";

/** The most process photos the page may have; raise it when the artist needs more. */
export const maxProcessPhotos = 30;

/** The whole list of process photos, which replaces the saved one. */
export const processPhotosBodySchema = z.strictObject({
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: photoListBodySchema(maxProcessPhotos),
});

export interface ProcessPhotosResponse {
  /** In the order the site shows them. */
  processPhotos: ListPhoto[];
}

export type ProcessPhotosBody = z.infer<typeof processPhotosBodySchema>;
