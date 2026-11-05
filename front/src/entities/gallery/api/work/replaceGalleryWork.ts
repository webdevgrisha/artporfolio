import { http, type Tagged } from "@/shared/api/http";

import { type GalleryWork, galleryWorkSchema } from "../../model/galleryWork";
import type { GalleryWorkBody } from "./galleryWorkBody";
import { workApiPath } from "./workApiPath";

interface ReplaceGalleryWorkParams {
  body: GalleryWorkBody;
  /** The ETag of the work the new one was made from. */
  etag: string;
  id: string;
}

/**
 * Replaces the work, all its fields at once, and returns it as saved with its new ETag. Rejected
 * with 412 when the work has changed since `etag` was read, with 404 when it was deleted, and with
 * 422 when it names a process photo, an upload, a section or a collection that no longer exists.
 */
export function replaceGalleryWork({
  body,
  etag,
  id,
}: ReplaceGalleryWorkParams): Promise<Tagged<GalleryWork>> {
  return http.putIfMatch({
    path: workApiPath(id),
    body,
    etag,
    schema: galleryWorkSchema,
  });
}
