import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryCollectionsQuery } from "@/entities/gallery";
import { CollectionsList } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { TableSkeleton } from "@/shared/ui/skeleton";

export function GalleryCollectionsSection() {
  return (
    <AwaitPageData fallback={<TableSkeleton rows={4} />}>
      <GalleryCollections />
    </AwaitPageData>
  );
}

function GalleryCollections() {
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);

  return <CollectionsList collections={collections} />;
}
