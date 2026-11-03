import styles from "./MediaSkeleton.module.css";
import { Skeleton } from "./Skeleton";

/** A labelled photo field that is loading: its label, then the frame of the photo. */
export function MediaSkeleton() {
  return (
    <div className={styles.root}>
      <Skeleton className={styles.label} />
      <Skeleton className={styles.frame} />
    </div>
  );
}
