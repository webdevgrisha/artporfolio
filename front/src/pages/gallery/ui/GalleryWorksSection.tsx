import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryMaterialsQuery, gallerySectionsQuery, galleryWorksQuery } from "@/entities/gallery";
import { WorksList } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { TableSkeleton } from "@/shared/ui/skeleton";

export function GalleryWorksSection() {
  return (
    <AwaitPageData fallback={<TableSkeleton rows={8} />}>
      <GalleryWorks />
    </AwaitPageData>
  );
}

function GalleryWorks() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: works } = useSuspenseQuery(galleryWorksQuery);
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);

  return <WorksList works={works} sections={sections} materials={materials.data.materials} />;
}
