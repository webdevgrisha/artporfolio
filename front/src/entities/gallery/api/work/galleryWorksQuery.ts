import { queryOptions } from "@tanstack/react-query";
import { galleryWorksQueryKey } from "./galleryWorksQueryKey";
import { getGalleryWorks } from "./getGalleryWorks";

/**
 * Every work in the order the site shows them, each by its summary: the description and the process
 * photos come with one work alone (`galleryWorkQuery`).
 */
export const galleryWorksQuery = queryOptions({
  queryFn: () => getGalleryWorks(),
  queryKey: [...galleryWorksQueryKey, "list"],
});
