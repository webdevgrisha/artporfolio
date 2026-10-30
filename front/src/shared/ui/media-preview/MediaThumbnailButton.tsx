import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

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
    <Tooltip className={className} content={openLabel}>
      <IconButton className={styles.button} label={openLabel} onClick={onOpen}>
        <MediaImage className={styles.image} source={item.source} />
      </IconButton>
    </Tooltip>
  );
}
