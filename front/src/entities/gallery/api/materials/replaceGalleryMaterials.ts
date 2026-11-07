import { http, type Tagged } from "@/shared/api/http";
import type { TranslationsBody } from "@/shared/api/translations";

import { type GalleryMaterials, galleryMaterialsSchema } from "../../model/galleryMaterials";

interface ReplaceGalleryMaterialsParams {
  /** The ETag of the materials the new list was made from. */
  etag: string;
  /** In any order: the server sorts them by title. A saved material left out is deleted. */
  materials: GalleryMaterials["items"];
  /** The titles in the other languages by id; the server makes those sent as null. */
  translations: TranslationsBody;
}

/**
 * Replaces every material and returns them as saved (trimmed, sorted by title) with their new
 * ETag. Rejected with 412 when they have changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryMaterials({
  etag,
  materials,
  translations,
}: ReplaceGalleryMaterialsParams): Promise<Tagged<GalleryMaterials>> {
  return http.putIfMatch({
    path: "/gallery/materials",
    body: { materials, translations },
    etag,
    schema: galleryMaterialsSchema,
  });
}
