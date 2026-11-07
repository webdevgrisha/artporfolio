import { z } from "zod";

import { translationsSchema } from "@/shared/api/translations";

/** The most subsections one section may have (backend/src/modules/gallery/sections/schema.ts). */
export const maxSubsections = 30;

export const subsectionSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type Subsection = z.infer<typeof subsectionSchema>;

/** A section of the gallery; a subsection has no subsections of its own. */
export const gallerySectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Sorted by title, as the site shows them. */
  subsections: z.array(subsectionSchema),
  /** The title, and each subsection by its id, in the other languages. */
  translations: translationsSchema,
});

export type GallerySection = z.infer<typeof gallerySectionSchema>;

/** A section in the list: everything but its translations, which only its own page loads. */
export const gallerySectionSummarySchema = gallerySectionSchema.omit({ translations: true });

export type GallerySectionSummary = z.infer<typeof gallerySectionSummarySchema>;

export const gallerySectionsResponseSchema = z.object({
  /** Sorted by title, as the site shows them. */
  sections: z.array(gallerySectionSummarySchema),
});
