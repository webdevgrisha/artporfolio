import { z } from "zod";

/** The most colors the gallery may have (backend/src/modules/gallery/colors/schema.ts). */
export const maxColors = 100;

export const galleryColorSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** The swatch, as #rrggbb in lower case. */
  hex: z.string(),
});

export type GalleryColor = z.infer<typeof galleryColorSchema>;

/** Every color of the gallery, sorted by title; there are none until they are first saved. */
export const galleryColorsSchema = z
  .object({ colors: z.array(galleryColorSchema) })
  .transform(({ colors }) => colors);

export type GalleryColors = z.infer<typeof galleryColorsSchema>;
