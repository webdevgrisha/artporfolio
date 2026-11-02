import { useQuery } from "@tanstack/react-query";

import { gallerySectionQuery } from "@/entities/gallery";

interface SectionTitleProps {
  id: string;
}

/** The title of a section, which follows a save; the loader of its page has fetched it. */
export function SectionTitle({ id }: SectionTitleProps) {
  const { data } = useQuery(gallerySectionQuery(id));

  return data?.data.title ?? "";
}
