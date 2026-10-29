import React from "react";

import { PreviewDialog } from "@/shared/ui/preview-dialog";

import { MediaImage } from "./MediaImage";
import styles from "./MediaPreviewDialog.module.css";
import type { MediaItem } from "./mediaItem";

interface MediaPreviewDialogProps {
  /** The item to show; `undefined` keeps the dialog closed. */
  item: MediaItem | undefined;
  onClose: () => void;
}

/** Shows an item in full, with its size in pixels measured once the image loads. */
export function MediaPreviewDialog({ item, onClose }: MediaPreviewDialogProps) {
  // Kept with its item, so the size of the previous item is never shown for the next one.
  const [loadedSize, setLoadedSize] = React.useState<{ id: string; text: string }>();
  const size = item && loadedSize?.id === item.id ? loadedSize.text : undefined;

  return (
    <PreviewDialog
      isOpen={Boolean(item)}
      title={item?.name ?? ""}
      description={size}
      onClose={onClose}
    >
      {item ? (
        <MediaImage
          className={styles.image}
          source={item.fullSizeSource ?? item.source}
          onLoad={({ currentTarget: { naturalHeight, naturalWidth } }) =>
            setLoadedSize({
              id: item.id,
              text: `${String(naturalWidth)} × ${String(naturalHeight)} px`,
            })
          }
        />
      ) : null}
    </PreviewDialog>
  );
}
