import type { CSSProperties } from "react";

import styles from "./FieldSkeleton.module.css";
import { Skeleton } from "./Skeleton";

interface FieldSkeletonProps {
  /** The rows of a textarea; a one-line input when left out. */
  rows?: number;
}

/** A labelled field that is loading: its label, then its control in the control's size. */
export function FieldSkeleton({ rows }: FieldSkeletonProps) {
  return (
    <div className={styles.root}>
      <Skeleton className={styles.label} />
      {rows === undefined ? (
        <Skeleton className={styles.input} />
      ) : (
        <Skeleton className={styles.textarea} style={{ "--rows": rows } as CSSProperties} />
      )}
    </div>
  );
}
