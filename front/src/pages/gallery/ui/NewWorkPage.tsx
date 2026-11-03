import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryMaterialsQuery, gallerySectionsQuery } from "@/entities/gallery";
import { CreateWorkForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function NewWorkPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData
        fallback={
          <FormSkeleton className={styles.form} isNarrow>
            <FieldSkeleton />
            <FieldSkeleton rows={8} />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <MediaSkeleton />
            <MediaSkeleton />
          </FormSkeleton>
        }
      >
        <NewWork />
      </AwaitPageData>
    </div>
  );
}

function NewWork() {
  // AwaitPageData has waited for the fresh lists, so this never suspends.
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);

  return (
    <CreateWorkForm
      className={styles.form}
      sections={sections}
      materials={materials.data.materials}
    />
  );
}
