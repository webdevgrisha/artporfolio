import { http } from "@/shared/api/http";

import { type GallerySection, gallerySectionsResponseSchema } from "../../model/gallerySection";

/** Every section, sorted by title. */
export async function getGallerySections(): Promise<GallerySection[]> {
  const { sections } = await http.get({
    path: "/gallery/sections",
    schema: gallerySectionsResponseSchema,
  });

  return sections;
}
