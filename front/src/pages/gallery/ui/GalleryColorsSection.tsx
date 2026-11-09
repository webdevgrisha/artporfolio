import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryColorsQuery, galleryWorkUsageQuery } from "@/entities/gallery";
import { EditColorsForm } from "@/features/edit-gallery";
import { LanguageForm } from "@/features/edit-translations";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function GalleryColorsSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isList>
          <FieldSkeleton />
          <ListSkeleton rows={10} />
        </FormSkeleton>
      }
    >
      <GalleryColors />
    </AwaitPageData>
  );
}

function GalleryColors() {
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);
  const { data: usage } = useSuspenseQuery(galleryWorkUsageQuery);

  return (
    <EditColorsForm
      className={styles.form}
      languageForm={LanguageForm}
      colors={colors}
      usages={usage.colors}
    />
  );
}
