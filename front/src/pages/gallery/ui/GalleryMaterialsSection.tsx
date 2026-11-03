import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryMaterialsQuery } from "@/entities/gallery";
import { EditMaterialsForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function GalleryMaterialsSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton />
          <ListSkeleton rows={6} />
        </FormSkeleton>
      }
    >
      <GalleryMaterials />
    </AwaitPageData>
  );
}

function GalleryMaterials() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);

  return <EditMaterialsForm className={styles.form} materials={materials} />;
}
