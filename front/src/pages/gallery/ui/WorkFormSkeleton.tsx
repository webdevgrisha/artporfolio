import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./GalleryPage.module.css";

/**
 * The work form while it loads, in the order of its fields: the photo, the title and the
 * description; the format, the size, the date, the country and the city; the sections and the collection; the materials,
 * the colors and the palettes; the sale status, the price with its discount and the price after it; the process
 * photos.
 */
export function WorkFormSkeleton() {
  return (
    <FormSkeleton className={styles.form} isNarrow>
      <MediaSkeleton />
      <FieldSkeleton />
      <FieldSkeleton rows={8} />
      <FieldSkeleton rows={4} />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton rows={6} />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton rows={4} />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <MediaSkeleton />
    </FormSkeleton>
  );
}
