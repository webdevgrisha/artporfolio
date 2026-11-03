import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryPalettesQuery } from "@/entities/gallery";
import { EditPalettesForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function GalleryPalettesSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton />
          <ListSkeleton rows={6} />
        </FormSkeleton>
      }
    >
      <GalleryPalettes />
    </AwaitPageData>
  );
}

function GalleryPalettes() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: palettes } = useSuspenseQuery(galleryPalettesQuery);

  return <EditPalettesForm className={styles.form} palettes={palettes} />;
}
