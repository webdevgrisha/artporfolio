import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { galleryCollectionQuery, galleryWorksQuery } from "@/entities/gallery";
import { EditCollectionForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function EditCollectionPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another collection shows its skeleton, then a form of its own, whose values come
          from the collection it opened with. */}
      <AwaitPageData
        key={id}
        fallback={
          <FormSkeleton className={styles.form} isNarrow>
            <FieldSkeleton />
            <FieldSkeleton rows={8} />
            <FieldSkeleton />
            <FieldSkeleton rows={4} />
            <MediaSkeleton />
          </FormSkeleton>
        }
      >
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

  return <EditCollectionForm className={styles.form} collection={collection} works={works} />;
}
