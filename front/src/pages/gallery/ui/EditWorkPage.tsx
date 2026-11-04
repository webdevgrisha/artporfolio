import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import {
  galleryCollectionsQuery,
  galleryColorsQuery,
  galleryMaterialsQuery,
  galleryPalettesQuery,
  gallerySectionsQuery,
  galleryWorkQuery,
} from "@/entities/gallery";
import { EditWorkForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function EditWorkPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another work shows its skeleton, then a form of its own, whose values come from
          the work it opened with. */}
      <AwaitPageData
        key={id}
        fallback={
          <FormSkeleton className={styles.form} isNarrow>
            <FieldSkeleton />
            <FieldSkeleton rows={8} />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <MediaSkeleton />
            <MediaSkeleton />
          </FormSkeleton>
        }
      >
        <EditWork id={id} />
      </AwaitPageData>
    </div>
  );
}

interface EditWorkProps {
  id: string;
}

function EditWork({ id }: EditWorkProps) {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: work } = useSuspenseQuery(galleryWorkQuery(id));
  const { data: sections } = useSuspenseQuery(gallerySectionsQuery);
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);
  const { data: palettes } = useSuspenseQuery(galleryPalettesQuery);
  const { data: collections } = useSuspenseQuery(galleryCollectionsQuery);

  return (
    <EditWorkForm
      className={styles.form}
      work={work}
      sections={sections}
      materials={materials.data.materials}
      colors={colors.data.colors}
      palettes={palettes.data.palettes}
      collections={collections}
    />
  );
}
