import { http, type Tagged } from "@/shared/api/http";

import { type GalleryMaterials, galleryMaterialsSchema } from "../../model/galleryMaterials";

/** Every material with the ETag that a replacement of the list sends back. */
export function getGalleryMaterials(): Promise<Tagged<GalleryMaterials>> {
  return http.getWithETag({ path: "/gallery/materials", schema: galleryMaterialsSchema });
}
