import { http, type Tagged } from "@/shared/api/http";

import { type GalleryMaterials, galleryMaterialsSchema } from "../../model/galleryMaterials";

interface ReplaceGalleryMaterialsParams {
  /** The ETag of the materials the new list was made from. */
  etag: string;
  /** In any order: the server sorts them by title. A saved material left out is deleted. */
  materials: GalleryMaterials;
}

/**
 * Replaces every material and returns them as saved (trimmed, sorted by title) with their new
 * ETag. Rejected with 412 when they have changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryMaterials({
  etag,
  materials,
}: ReplaceGalleryMaterialsParams): Promise<Tagged<GalleryMaterials>> {
  return http.putIfMatch({
    path: "/gallery/materials",
    body: { materials },
    etag,
    schema: galleryMaterialsSchema,
  });
}
