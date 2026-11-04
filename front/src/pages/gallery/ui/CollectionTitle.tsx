import { useQuery } from "@tanstack/react-query";

import { galleryCollectionQuery } from "@/entities/gallery";

interface CollectionTitleProps {
  id: string;
}

/**
 * The title of a collection, which follows a save. The loader of its page loads it; until then the
 * title is the one in the cache, or none.
 */
export function CollectionTitle({ id }: CollectionTitleProps) {
  const { data } = useQuery(galleryCollectionQuery(id));

  return data?.data.title ?? "";
}
