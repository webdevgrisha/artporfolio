import clsx from "clsx";

import { ListSkeleton } from "./ListSkeleton";
import { Skeleton } from "./Skeleton";
import { SkeletonRegion } from "./SkeletonRegion";
import styles from "./TableSkeleton.module.css";

interface TableSkeletonProps {
  className?: string;
  /** As many as the table is likely to have, so the page keeps its height when it loads. */
  rows: number;
}

/** A table with its search and its adding button that is loading. */
export function TableSkeleton({ className, rows }: TableSkeletonProps) {
  return (
    <SkeletonRegion className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <Skeleton className={styles.search} />
        <Skeleton className={styles.add} />
      </div>
      <ListSkeleton rows={rows} />
    </SkeletonRegion>
  );
}
