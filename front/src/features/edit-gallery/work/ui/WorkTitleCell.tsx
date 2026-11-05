import type { GalleryWorkSummary } from "@/entities/gallery";

import styles from "./WorksList.module.css";

interface WorkTitleCellProps {
  work: GalleryWorkSummary;
}

/** The title of a work; a hidden work says so under it, muted, as the discount is under the price. */
export function WorkTitleCell({ work }: WorkTitleCellProps) {
  return (
    <>
      {work.title}
      {work.published ? null : <div className={styles.muted}>скрыта</div>}
    </>
  );
}
