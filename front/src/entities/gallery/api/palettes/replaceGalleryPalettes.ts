import { http, type Tagged } from "@/shared/api/http";

import { type GalleryPalettes, galleryPalettesSchema } from "../../model/galleryPalettes";

interface ReplaceGalleryPalettesParams {
  /** The ETag of the palettes the new list was made from. */
  etag: string;
  /** In any order: the server sorts them by title. A saved palette left out is deleted. */
  palettes: GalleryPalettes;
}

/**
 * Replaces every palette and returns them as saved (trimmed, sorted by title) with their new
 * ETag. Rejected with 412 when they have changed since `etag` was read, for example in another tab.
 */
export function replaceGalleryPalettes({
  etag,
  palettes,
}: ReplaceGalleryPalettesParams): Promise<Tagged<GalleryPalettes>> {
  return http.putIfMatch({
    path: "/gallery/palettes",
    body: { palettes },
    etag,
    schema: galleryPalettesSchema,
  });
}
