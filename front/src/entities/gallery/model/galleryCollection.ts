import { z } from "zod";

import { photoSchema } from "@/shared/api/photo";
import { translationsSchema } from "@/shared/api/translations";

/** The most works one collection may hold (backend/src/modules/gallery/collections/schema.ts). */
export const maxCollectionWorks = 200;

/** A collection of the gallery: works painted as one series. */
export const galleryCollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  cover: photoSchema,
  /** The year the collection was started. */
  startYear: z.number(),
  /** The year it was finished; null for a collection of one year. */
  endYear: z.number().nullable(),
  /** The ids of its works, in the order the site shows them: the latest first. */
  workIds: z.array(z.string()),
  /** The title, the description and the cover's alt text in the other languages. */
  translations: translationsSchema,
  /** When the collection was created, ISO 8601. */
  createdAt: z.iso.datetime(),
  /** When the admin last saved the collection, ISO 8601. */
  updatedAt: z.iso.datetime(),
});

export type GalleryCollection = z.infer<typeof galleryCollectionSchema>;

/** A collection in the list: everything but its translations, which only its own page loads. */
export const galleryCollectionSummarySchema = galleryCollectionSchema.omit({ translations: true });

export type GalleryCollectionSummary = z.infer<typeof galleryCollectionSummarySchema>;

export const galleryCollectionsResponseSchema = z.object({
  /** In the order the site shows them: the latest first. */
  collections: z.array(galleryCollectionSummarySchema),
});
