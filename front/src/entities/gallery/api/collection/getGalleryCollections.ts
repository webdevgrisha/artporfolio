import { http } from "@/shared/api/http";

import {
  type GalleryCollectionSummary,
  galleryCollectionsResponseSchema,
} from "../../model/galleryCollection";

/** Every collection in the order the site shows them. */
export async function getGalleryCollections(): Promise<GalleryCollectionSummary[]> {
  const { collections } = await http.get({
    path: "/gallery/collections",
    schema: galleryCollectionsResponseSchema,
  });

  return collections;
}
