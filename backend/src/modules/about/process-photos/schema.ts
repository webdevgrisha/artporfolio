import { z } from "zod";

import type { Translations } from "#shared/i18n/translations";
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
  /** The alt texts in the other languages, by the id of the photo. */
  translations: Translations;
}

export type ProcessPhotosBody = z.infer<typeof processPhotosBodySchema>;
