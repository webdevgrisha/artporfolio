import { http, type Tagged } from "@/shared/api/http";

import { type GallerySection, gallerySectionSchema } from "../../model/gallerySection";
import type { GallerySectionBody } from "./gallerySectionBody";
import { sectionApiPath } from "./sectionApiPath";

interface CreateGallerySectionParams {
  body: GallerySectionBody;
  /** A new UUID, which the client picks, so that a repeated request names the same section. */
  id: string;
}

/**
 * Creates the section `id` and returns it as saved with its ETag. Rejected with 412 when the
 * section exists, for example created by an earlier try whose response was lost, and with 409
 * when another section has its title.
 */
export function createGallerySection({
  body,
  id,
}: CreateGallerySectionParams): Promise<Tagged<GallerySection>> {
  return http.putIfNoneMatch({
    path: sectionApiPath(id),
    body,
    schema: gallerySectionSchema,
  });
}
