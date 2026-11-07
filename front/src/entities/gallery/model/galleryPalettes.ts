import { z } from "zod";

import { translationsSchema } from "@/shared/api/translations";

/** The most palettes the gallery may have (backend/src/modules/gallery/palettes/schema.ts). */
export const maxPalettes = 30;

export const galleryPaletteSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type GalleryPalette = z.infer<typeof galleryPaletteSchema>;

/** Every palette of the gallery, sorted by title; there are none until they are first saved. */
export const galleryPalettesSchema = z
  .object({ palettes: z.array(galleryPaletteSchema), translations: translationsSchema })
  .transform(({ palettes, translations }) => ({ items: palettes, translations }));

export type GalleryPalettes = z.infer<typeof galleryPalettesSchema>;
