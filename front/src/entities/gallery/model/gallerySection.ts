import { z } from "zod";

/** The most subsections one section may have (backend/src/modules/gallery-sections/schema.ts). */
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
});

export type GallerySection = z.infer<typeof gallerySectionSchema>;

/** The shape of every API response that returns one section. */
export const gallerySectionResponseSchema = z.object({
  section: gallerySectionSchema,
});

export const gallerySectionsResponseSchema = z.object({
  /** Sorted by title, as the site shows them. */
  sections: z.array(gallerySectionSchema),
});
