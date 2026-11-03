import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryIntroQuery } from "@/entities/gallery";
import { EditGalleryIntroForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function GalleryIntroSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton rows={12} />
        </FormSkeleton>
      }
    >
      <GalleryIntro />
    </AwaitPageData>
  );
}

function GalleryIntro() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: intro } = useSuspenseQuery(galleryIntroQuery);

  return <EditGalleryIntroForm className={styles.form} intro={intro} />;
}
