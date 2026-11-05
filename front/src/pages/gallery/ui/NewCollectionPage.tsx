import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryWorksQuery } from "@/entities/gallery";
import { CreateCollectionForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";

import { CollectionFormSkeleton } from "./CollectionFormSkeleton";
import styles from "./GalleryPage.module.css";

export function NewCollectionPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData fallback={<CollectionFormSkeleton />}>
        <NewCollection />
      </AwaitPageData>
    </div>
  );
}

function NewCollection() {
  const { data: works } = useSuspenseQuery(galleryWorksQuery);

  return <CreateCollectionForm className={styles.form} works={works} />;
}
