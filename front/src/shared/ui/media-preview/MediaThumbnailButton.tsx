import { IconAction } from "@/shared/ui/icon-button";

import { MediaImage } from "./MediaImage";
import styles from "./MediaThumbnailButton.module.css";
import type { MediaItem } from "./mediaItem";

interface MediaThumbnailButtonProps {
  /** Positions the button. */
  className?: string;
  item: MediaItem;
  /** Opens the item in full, e.g. in `MediaPreviewDialog`. */
  onOpen: () => void;
}

/** A square thumbnail of an item that opens it in full. */
export function MediaThumbnailButton({ className, item, onOpen }: MediaThumbnailButtonProps) {
  const openLabel = `Открыть ${item.name}`;

  return (
    <IconAction
      tooltipClassName={className}
      className={styles.button}
      label={openLabel}
      onClick={onOpen}
    >
      <MediaImage className={styles.image} sizes="3.5rem" source={item.source} />
    </IconAction>
  );
}
