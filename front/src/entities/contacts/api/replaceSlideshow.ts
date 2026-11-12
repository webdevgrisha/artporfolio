import { http, type Tagged } from "@/shared/api/http";
import type { ListPhotoItem } from "@/shared/api/photo";

import { type Slideshow, type SlideshowSource, slideshowSchema } from "../model/slideshow";

interface ReplaceSlideshowParams {
  /** The ETag of the slideshow the new one was made from. */
  etag: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  photos: readonly ListPhotoItem[];
  source: SlideshowSource;
}

/**
 * Replaces the whole slideshow at once: the server saves all of it or nothing, and returns it as
 * saved. Rejected with 412 when it has changed since `etag` was read, for example in another tab,
 * and with 422 when it names a photo or an upload that no longer exists.
 */
export function replaceSlideshow({
  etag,
  photos,
  source,
}: ReplaceSlideshowParams): Promise<Tagged<Slideshow>> {
  return http.putIfMatch({
    path: "/contacts/slideshow",
    body: { photos, source },
    etag,
    schema: slideshowSchema,
  });
}
