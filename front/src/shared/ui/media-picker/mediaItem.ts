/** A file shown in `MediaPicker`: either picked on this device or already on the server. */
export interface MediaItem {
  /** Stable key of the item; `onRemove` receives it. */
  id: string;
  name: string;
  /** In bytes. */
  size: number;
  /** A picked file, or the URL of an image on the server. */
  source: File | string;
}
