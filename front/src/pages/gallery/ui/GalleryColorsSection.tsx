import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryColorsQuery } from "@/entities/gallery";
import { EditColorsForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function GalleryColorsSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton />
          <ListSkeleton rows={6} />
        </FormSkeleton>
      }
    >
      <GalleryColors />
    </AwaitPageData>
  );
}

function GalleryColors() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);

  return <EditColorsForm className={styles.form} colors={colors} />;
}
