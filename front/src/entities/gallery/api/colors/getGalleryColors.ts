import { http, type Tagged } from "@/shared/api/http";

import { type GalleryColors, galleryColorsSchema } from "../../model/galleryColors";

/** Every color with the ETag that a replacement of the list sends back. */
export function getGalleryColors(): Promise<Tagged<GalleryColors>> {
  return http.getWithETag({ path: "/gallery/colors", schema: galleryColorsSchema });
}
