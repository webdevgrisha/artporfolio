import { queryOptions } from "@tanstack/react-query";
import { gallerySectionsQueryKey } from "./gallerySectionsQueryKey";
import { getGallerySection } from "./getGallerySection";

/** One section with its ETag. A save puts the saved section here. */
export function gallerySectionQuery(id: string) {
  return queryOptions({
    queryFn: () => getGallerySection(id),
    queryKey: [...gallerySectionsQueryKey, "item", id],
  });
}
