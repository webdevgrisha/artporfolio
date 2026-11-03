import styles from "./ListSkeleton.module.css";
import { Skeleton } from "./Skeleton";

interface ListSkeletonProps {
  /** As many as the list is likely to have, so the page keeps its height when it loads. */
  rows: number;
}

/** A list of titles that is loading: rows between light lines, each a line of text. */
export function ListSkeleton({ rows }: ListSkeletonProps) {
  return (
    // Hidden, so a screen reader does not count the empty rows: the region says it loads.
    <ul className={styles.root} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the rows never move
        <li key={index} className={styles.row}>
          <Skeleton className={styles.title} />
        </li>
      ))}
    </ul>
  );
}
