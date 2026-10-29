import type { MediaItem } from "@/shared/ui/media-preview";

/** An item of `SortableMediaList`. */
export interface SortableMediaItem extends MediaItem {
  /** Highlights an item that differs from the saved one. */
  isModified?: boolean;
}
