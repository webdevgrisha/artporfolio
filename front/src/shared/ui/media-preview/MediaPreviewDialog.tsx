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
  const source = item ? (item.fullSizeSource ?? item.source) : undefined;
  // Kept with its image, not its item: a replaced file keeps the item but is another image, and
  // the size of the previous one must not be shown for it.
  const [loadedSize, setLoadedSize] = React.useState<{ source: File | string; text: string }>();
  const size = source !== undefined && loadedSize?.source === source ? loadedSize.text : undefined;

  return (
    <PreviewDialog
      isOpen={Boolean(item)}
      title={item?.name ?? ""}
      description={size}
      onClose={onClose}
    >
      {source !== undefined ? (
        <MediaImage
          className={styles.image}
          source={source}
          onLoad={({ currentTarget: { naturalHeight, naturalWidth } }) =>
            setLoadedSize({
              source,
              text: `${String(naturalWidth)} × ${String(naturalHeight)} px`,
            })
          }
        />
      ) : null}
    </PreviewDialog>
  );
}
