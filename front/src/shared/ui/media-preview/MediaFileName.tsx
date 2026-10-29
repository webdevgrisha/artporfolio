import clsx from "clsx";

import { formatFileSize } from "@/shared/lib/formatFileSize";

import styles from "./MediaFileName.module.css";
import type { MediaItem } from "./mediaItem";

interface MediaFileNameProps {
  className?: string;
  item: MediaItem;
}

/** The name of an item with its size: `photo.jpg (466 КБ)`. A long name wraps anywhere. */
export function MediaFileName({ className, item }: MediaFileNameProps) {
  return (
    <span className={clsx(styles.root, className)}>
      {item.name} <span className={styles.size}>({formatFileSize(item.size)})</span>
    </span>
  );
}
