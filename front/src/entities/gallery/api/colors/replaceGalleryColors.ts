import { http, type Tagged } from "@/shared/api/http";

import { type GalleryColors, galleryColorsSchema } from "../../model/galleryColors";

interface ReplaceGalleryColorsParams {
  /** The ETag of the colors the new list was made from. */
  etag: string;
  /** In any order: the server sorts them by title. A saved color left out is deleted. */
  colors: GalleryColors;
}

/**
 * Replaces every color and returns them as saved (trimmed, sorted by title) with their new
 * ETag. Rejected with 412 when they have changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryColors({
  etag,
  colors,
}: ReplaceGalleryColorsParams): Promise<Tagged<GalleryColors>> {
  return http.putIfMatch({
    path: "/gallery/colors",
    body: { colors },
    etag,
    schema: galleryColorsSchema,
  });
}
