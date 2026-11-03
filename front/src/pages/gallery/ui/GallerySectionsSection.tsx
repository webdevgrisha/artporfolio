import { useSuspenseQuery } from "@tanstack/react-query";

import { gallerySectionsQuery } from "@/entities/gallery";
import { SectionsList } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { TableSkeleton } from "@/shared/ui/skeleton";

export function GallerySectionsSection() {
  return (
    <AwaitPageData fallback={<TableSkeleton rows={6} />}>
      <GallerySections />
    </AwaitPageData>
  );
}

function GallerySections() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);

  return <SectionsList sections={sections} />;
}
