import clsx from "clsx";
import type { ReactNode } from "react";

import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./SkeletonRegion.module.css";

interface SkeletonRegionProps {
  /** The skeletons. */
  children: ReactNode;
  className?: string;
}

/**
 * The place of content that is loading, filled with skeletons in its shape. It shows after a
 * moment, so content that arrives at once does not flash it, and tells screen readers it loads.
 */
export function SkeletonRegion({ children, className }: SkeletonRegionProps) {
  return (
    <div className={clsx(styles.root, className)} role="status">
      <VisuallyHidden>Загрузка</VisuallyHidden>
      {children}
    </div>
  );
}
