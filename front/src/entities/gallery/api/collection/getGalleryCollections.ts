import { http } from "@/shared/api/http";

import {
  type GalleryCollection,
  galleryCollectionsResponseSchema,
} from "../../model/galleryCollection";

/** Every collection in the order the site shows them. */
export async function getGalleryCollections(): Promise<GalleryCollection[]> {
  const { collections } = await http.get({
    path: "/gallery/collections",
    schema: galleryCollectionsResponseSchema,
  });

  return collections;
}
