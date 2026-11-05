import { http, type Tagged } from "@/shared/api/http";

import { type GalleryCollection, galleryCollectionSchema } from "../../model/galleryCollection";
import { collectionApiPath } from "./collectionApiPath";
import type { GalleryCollectionBody } from "./galleryCollectionBody";

interface ReplaceGalleryCollectionParams {
  body: GalleryCollectionBody;
  /** The ETag of the collection the new one was made from. */
  etag: string;
  id: string;
}

/**
 * Replaces the collection and its works and returns it as saved with its new ETag. Rejected with
 * 412 when the collection or its works have changed since `etag` was read, with 404 when it was
 * deleted, with 409 when another collection has its title, and with 422 when the upload of the
 * cover has expired or a work no longer exists.
 */
export function replaceGalleryCollection({
  body,
  etag,
  id,
}: ReplaceGalleryCollectionParams): Promise<Tagged<GalleryCollection>> {
  return http.putIfMatch({
    path: collectionApiPath(id),
    body,
    etag,
    schema: galleryCollectionSchema,
  });
}
