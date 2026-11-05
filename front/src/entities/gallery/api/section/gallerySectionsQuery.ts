import { queryOptions } from "@tanstack/react-query";
import { gallerySectionsQueryKey } from "./gallerySectionsQueryKey";
import { getGallerySections } from "./getGallerySections";

/** Every section, sorted by title. */
export const gallerySectionsQuery = queryOptions({
  queryFn: () => getGallerySections(),
  queryKey: [...gallerySectionsQueryKey, "list"],
});
