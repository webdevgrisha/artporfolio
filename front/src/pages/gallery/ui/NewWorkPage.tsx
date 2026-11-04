import { useSuspenseQuery } from "@tanstack/react-query";

import {
  galleryCollectionsQuery,
  galleryColorsQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionsQuery,
} from "@/entities/gallery";
import { CreateWorkForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./GalleryPage.module.css";
import { WorkFormSkeleton } from "./WorkFormSkeleton";

export function NewWorkPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData fallback={<WorkFormSkeleton />}>
        <NewWork />
      </AwaitPageData>
    </div>
  );
}

function NewWork() {
  // AwaitPageData has waited for the fresh lists, so this never suspends.
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);
  const { data: palettes } = useSuspenseQuery(galleryPalettesQuery);
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);

  return (
    <CreateWorkForm
      className={styles.form}
      sections={sections}
      materials={materials.data.materials}
      colors={colors.data.colors}
      palettes={palettes.data.palettes}
      collections={collections}
    />
  );
}
