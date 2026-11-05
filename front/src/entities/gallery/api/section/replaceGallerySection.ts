import { http, type Tagged } from "@/shared/api/http";

import { type GallerySection, gallerySectionSchema } from "../../model/gallerySection";
import type { GallerySectionBody } from "./gallerySectionBody";
import { sectionApiPath } from "./sectionApiPath";

interface ReplaceGallerySectionParams {
  body: GallerySectionBody;
  /** The ETag of the section the new one was made from. */
  etag: string;
  id: string;
}

/**
 * Replaces the section with its subsections and returns it as saved with its new ETag. Rejected
 * with 412 when the section has changed since `etag` was read, with 404 when it was deleted, and
 * with 409 when another section has its title.
 */
export function replaceGallerySection({
  body,
  etag,
  id,
}: ReplaceGallerySectionParams): Promise<Tagged<GallerySection>> {
  return http.putIfMatch({
    path: sectionApiPath(id),
    body,
    etag,
    schema: gallerySectionSchema,
  });
}
