import { http, type Tagged } from "@/shared/api/http";

import { type GalleryCollection, galleryCollectionSchema } from "../../model/galleryCollection";
import { collectionApiPath } from "./collectionApiPath";

/** The collection with its ETag, which a change of it sends back. */
export function getGalleryCollection(id: string): Promise<Tagged<GalleryCollection>> {
  return http.getWithETag({ path: collectionApiPath(id), schema: galleryCollectionSchema });
}
