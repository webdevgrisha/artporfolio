import { z } from "zod";

/** The most palettes the gallery may have (backend/src/modules/gallery/palettes/schema.ts). */
export const maxPalettes = 30;

export const galleryPaletteSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type GalleryPalette = z.infer<typeof galleryPaletteSchema>;

/** Every palette of the gallery, sorted by title; there are none until they are first saved. */
export const galleryPalettesSchema = z
  .object({ palettes: z.array(galleryPaletteSchema) })
  .transform(({ palettes }) => palettes);

export type GalleryPalettes = z.infer<typeof galleryPalettesSchema>;
