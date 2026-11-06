import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./FormSkeleton.module.css";
import { Skeleton } from "./Skeleton";
import { SkeletonRegion } from "./SkeletonRegion";

interface FormSkeletonProps {
  /** The skeletons of the fields. */
  children: ReactNode;
  /** As the form it stands for, such as one that fills the frame. */
  className?: string;
  /** For a list of rows, such as a list of titles. */
  isList?: boolean;
  /** For a form whose fields keep a readable line length. */
  isNarrow?: boolean;
}

/** An EditForm that is loading: its fields, then its buttons at the bottom. */
export function FormSkeleton({
  children,
  className,
  isList = false,
  isNarrow = false,
}: FormSkeletonProps) {
  return (
    <SkeletonRegion className={clsx(styles.root, className)}>
      <div className={clsx(styles.fields, isList && styles.list, isNarrow && styles.narrow)}>
        {children}
      </div>
      <div className={styles.actions}>
        <Skeleton className={styles.revert} />
        <Skeleton className={styles.save} />
      </div>
    </SkeletonRegion>
  );
}
