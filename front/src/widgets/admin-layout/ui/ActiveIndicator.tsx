import type { CSSProperties } from "react";

import styles from "./AdminNavigation.module.css";

interface ActiveIndicatorProps {
  activeIndex: number;
}

/** The mark that slides to the current page of the navigation. */
export function ActiveIndicator({ activeIndex }: ActiveIndicatorProps) {
  if (activeIndex < 0) return null;

  return (
    <span
      className={styles.activeIndicator}
      style={{ "--active-index": activeIndex } as CSSProperties}
      aria-hidden="true"
    />
  );
}
