import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryWorksQuery } from "@/entities/gallery";
import { CreateCollectionForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function NewCollectionPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData
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
        <NewCollection />
      </AwaitPageData>
    </div>
  );
}

function NewCollection() {
  // AwaitPageData has waited for the fresh works, so this never suspends.
  const { data: works } = useSuspenseQuery(galleryWorksQuery);

  return <CreateCollectionForm className={styles.form} works={works} />;
}
