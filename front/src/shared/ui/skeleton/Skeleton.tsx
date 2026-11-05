import clsx from "clsx";
import type { CSSProperties } from "react";

import styles from "./Skeleton.module.css";

interface SkeletonProps {
  /** Sets the size of the block, as the thing it stands for. */
  className?: string;
  /** Custom properties the class sizes the block by, such as the rows of a textarea. */
  style?: CSSProperties;
}

/** A block in place of content that is loading. Decorative: its region tells it is loading. */
export function Skeleton({ className, style }: SkeletonProps) {
  return <span className={clsx(styles.root, className)} style={style} />;
}
