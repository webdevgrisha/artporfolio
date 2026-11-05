import { useSuspenseQuery } from "@tanstack/react-query";

import { gallerySectionsQuery, galleryWorkUsageQuery } from "@/entities/gallery";
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
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: usage } = useSuspenseQuery(galleryWorkUsageQuery);

  return <SectionsList sections={sections} usages={usage.sections} />;
}
