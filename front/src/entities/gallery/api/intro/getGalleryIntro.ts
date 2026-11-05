import { http, type Tagged } from "@/shared/api/http";

import { type GalleryIntro, galleryIntroSchema } from "../../model/galleryIntro";

/** The text with the ETag that a replacement of it sends back. */
export function getGalleryIntro(): Promise<Tagged<GalleryIntro>> {
  return http.getWithETag({ path: "/gallery/intro", schema: galleryIntroSchema });
}
