import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

/** The collection form while it loads: the cover, the title, the description, the years, the works. */
export function CollectionFormSkeleton() {
  return (
    <FormSkeleton className={styles.form} isNarrow>
      <MediaSkeleton />
      <FieldSkeleton />
      <FieldSkeleton rows={8} />
      <FieldSkeleton />
      <FieldSkeleton rows={4} />
    </FormSkeleton>
  );
}
