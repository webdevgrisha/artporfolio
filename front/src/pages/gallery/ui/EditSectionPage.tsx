import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { gallerySectionQuery, galleryWorkUsageQuery } from "@/entities/gallery";
import { EditSectionForm } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

export function EditSectionPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another section shows its skeleton, then a form of its own, whose values come
          from the section it opened with. */}
      <AwaitPageData
        key={id}
        fallback={
          <FormSkeleton className={styles.form} isNarrow>
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </FormSkeleton>
        }
      >
        <EditSection id={id} />
      </AwaitPageData>
    </div>
  );
}

interface EditSectionProps {
  id: string;
}

function EditSection({ id }: EditSectionProps) {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: section } = useSuspenseQuery(gallerySectionQuery(id));
  const { data: usage } = useSuspenseQuery(galleryWorkUsageQuery);

  return <EditSectionForm className={styles.form} section={section} usages={usage.sections} />;
}
