import { queryOptions } from "@tanstack/react-query";
import { galleryCollectionsQueryKey } from "./galleryCollectionsQueryKey";
import { getGalleryCollection } from "./getGalleryCollection";

/** One collection with its ETag. A save puts the saved collection here. */
export function galleryCollectionQuery(id: string) {
  return queryOptions({
    queryFn: () => getGalleryCollection(id),
    queryKey: [...galleryCollectionsQueryKey, "item", id],
  });
}
