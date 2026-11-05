import { queryOptions } from "@tanstack/react-query";
import { galleryCollectionsQueryKey } from "./galleryCollectionsQueryKey";
import { getGalleryCollections } from "./getGalleryCollections";

/** Every collection in the order the site shows them. */
export const galleryCollectionsQuery = queryOptions({
  queryFn: () => getGalleryCollections(),
  queryKey: [...galleryCollectionsQueryKey, "list"],
});
