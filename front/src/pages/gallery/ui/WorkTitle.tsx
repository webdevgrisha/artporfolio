import { useQuery } from "@tanstack/react-query";

import { galleryWorkQuery } from "@/entities/gallery";

interface WorkTitleProps {
  id: string;
}

/**
 * The title of a work, which follows a save. The loader of its page loads it; until then the title
 * is the one in the cache, or none.
 */
export function WorkTitle({ id }: WorkTitleProps) {
  const { data } = useQuery(galleryWorkQuery(id));

  return data?.data.title ?? "";
}
