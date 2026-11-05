import { http, type Tagged } from "@/shared/api/http";

import { type GalleryWork, galleryWorkSchema } from "../../model/galleryWork";
import type { GalleryWorkBody } from "./galleryWorkBody";
import { workApiPath } from "./workApiPath";

interface CreateGalleryWorkParams {
  body: GalleryWorkBody;
  /** A new UUID, which the client picks, so that a repeated request names the same work. */
  id: string;
}

/**
 * Creates the work `id` and returns it as saved with its ETag. Rejected with 412 when the work
 * exists, for example created by an earlier try whose response was lost, and with 422 when the
 * upload of a photo has expired or a section or the collection no longer exists.
 */
export function createGalleryWork({
  body,
  id,
}: CreateGalleryWorkParams): Promise<Tagged<GalleryWork>> {
  return http.putIfNoneMatch({
    path: workApiPath(id),
    body,
    schema: galleryWorkSchema,
  });
}
