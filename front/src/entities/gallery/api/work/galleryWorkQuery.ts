import { queryOptions } from "@tanstack/react-query";
import { galleryWorksQueryKey } from "./galleryWorksQueryKey";
import { getGalleryWork } from "./getGalleryWork";

/** One work with its ETag. A save puts the saved work here. */
export function galleryWorkQuery(id: string) {
  return queryOptions({
    queryFn: () => getGalleryWork(id),
    queryKey: [...galleryWorksQueryKey, "item", id],
  });
}
