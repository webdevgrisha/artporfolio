import { http, type Tagged } from "@/shared/api/http";

import { type GalleryCollection, galleryCollectionSchema } from "../../model/galleryCollection";
import { collectionApiPath } from "./collectionApiPath";
import type { GalleryCollectionBody } from "./galleryCollectionBody";

interface CreateGalleryCollectionParams {
  body: GalleryCollectionBody;
  /** A new UUID, which the client picks, so that a repeated request names the same collection. */
  id: string;
}

/**
 * Creates the collection `id` with its works and returns it as saved with its ETag. Rejected with
 * 412 when the collection exists, for example created by an earlier try whose response was lost,
 * with 409 when another collection has its title, and with 422 when the upload of the cover has
 * expired or a work no longer exists.
 */
export function createGalleryCollection({
  body,
  id,
}: CreateGalleryCollectionParams): Promise<Tagged<GalleryCollection>> {
  return http.putIfNoneMatch({
    path: collectionApiPath(id),
    body,
    schema: galleryCollectionSchema,
  });
}
