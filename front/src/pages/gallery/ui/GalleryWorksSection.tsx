import { useSuspenseQuery } from "@tanstack/react-query";

import {
  galleryCollectionsQuery,
  galleryMaterialsQuery,
  gallerySectionsQuery,
  galleryWorksQuery,
} from "@/entities/gallery";
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
  const { data: works } = useSuspenseQuery(galleryWorksQuery);
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);

  return (
    <WorksList
      works={works}
      sections={sections}
      materials={materials.data.items}
      collections={collections}
    />
  );
}
