import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import {
  galleryCollectionQuery,
  galleryCollectionsQuery,
  galleryWorksQuery,
} from "@/entities/gallery";
import { EditCollectionForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";

import { CollectionFormSkeleton } from "./CollectionFormSkeleton";
import styles from "./GalleryPage.module.css";

export function EditCollectionPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another collection shows its skeleton, then a form of its own, whose values come
          from the collection it opened with. */}
      <AwaitPageData key={id} fallback={<CollectionFormSkeleton />}>
        <EditCollection id={id} />
      </AwaitPageData>
    </div>
  );
}

interface EditCollectionProps {
  id: string;
}

function EditCollection({ id }: EditCollectionProps) {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: collection } = useSuspenseQuery(galleryCollectionQuery(id));
  const { data: works } = useSuspenseQuery(galleryWorksQuery);
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);

  return (
    <EditCollectionForm
      className={styles.form}
      collection={collection}
      works={works}
      collections={collections}
    />
  );
}
