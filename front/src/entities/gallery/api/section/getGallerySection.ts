import { http, type Tagged } from "@/shared/api/http";

import { type GallerySection, gallerySectionSchema } from "../../model/gallerySection";
import { sectionApiPath } from "./sectionApiPath";

/** The section with its ETag, which a change of it sends back. */
export function getGallerySection(id: string): Promise<Tagged<GallerySection>> {
  return http.getWithETag({ path: sectionApiPath(id), schema: gallerySectionSchema });
}
