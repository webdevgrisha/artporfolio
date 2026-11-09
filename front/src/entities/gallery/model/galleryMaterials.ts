import { z } from "zod";

/** The most materials the gallery may have (backend/src/modules/gallery/materials/schema.ts). */
export const maxMaterials = 100;

const galleryMaterialSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type GalleryMaterial = z.infer<typeof galleryMaterialSchema>;

/** Every material of the gallery, sorted by title; there are none until they are first saved. */
export const galleryMaterialsSchema = z
  .object({ materials: z.array(galleryMaterialSchema) })
  .transform(({ materials }) => materials);

export type GalleryMaterials = z.infer<typeof galleryMaterialsSchema>;
