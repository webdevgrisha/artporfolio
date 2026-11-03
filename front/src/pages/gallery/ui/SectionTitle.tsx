import { useQuery } from "@tanstack/react-query";

import { gallerySectionQuery } from "@/entities/gallery";

interface SectionTitleProps {
  id: string;
}

/**
 * The title of a section, which follows a save. The loader of its page loads it; until then the title
 * is the one in the cache, or none.
 */
export function SectionTitle({ id }: SectionTitleProps) {
  const { data } = useQuery(gallerySectionQuery(id));

  return data?.data.title ?? "";
}
