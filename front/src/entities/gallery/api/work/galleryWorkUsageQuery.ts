import { queryOptions } from "@tanstack/react-query";

import { galleryWorksQueryKey } from "./galleryWorksQueryKey";
import { getGalleryWorkUsage } from "./getGalleryWorkUsage";

/**
 * How many works name each section, material, color and palette: the numbers alone, so a list
 * shows its counts without loading every work. Under the key of the works, so any change of a work
 * refreshes it too.
 */
export const galleryWorkUsageQuery = queryOptions({
  queryFn: () => getGalleryWorkUsage(),
  queryKey: [...galleryWorksQueryKey, "usage"],
});
