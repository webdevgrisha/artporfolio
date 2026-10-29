import type { Image } from "@/shared/api/image";

/** A file shown in `MediaPicker`: either picked on this device or already on the server. */
export interface MediaItem {
  /** A larger image for the preview dialog; `source` is shown there when it is absent. */
  fullSizeSource?: string;
  /** Stable key of the item; `onRemove` receives it. */
  id: string;
  name: string;
  /** In bytes. */
  size: number;
  /** A picked file, or the URL of an image on the server. Shown as the thumbnail. */
  source: File | string;
}

/** An image stored on the server, as an item of `MediaPicker`. */
export function imageToMediaItem({ fileName, fileSize, sources, version }: Image): MediaItem {
  // Ordered by width: the smallest one for the thumbnail, the largest for the preview dialog.
  const [thumbnail] = sources.webp;

  return {
    fullSizeSource: sources.webp.at(-1)?.url,
    id: version,
    name: fileName,
    size: fileSize,
    source: thumbnail.url,
  };
}
