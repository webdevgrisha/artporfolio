import { http, type Tagged } from "@/shared/api/http";

import { type GalleryPalettes, galleryPalettesSchema } from "../../model/galleryPalettes";

/** Every palette with the ETag that a replacement of the list sends back. */
export function getGalleryPalettes(): Promise<Tagged<GalleryPalettes>> {
  return http.getWithETag({ path: "/gallery/palettes", schema: galleryPalettesSchema });
}
