import { useSuspenseQuery } from "@tanstack/react-query";

import { gallerySectionsQuery } from "@/entities/gallery";
import { SectionsList } from "@/features/edit-gallery";

export function GallerySectionsSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);

  return <SectionsList sections={sections} />;
}
